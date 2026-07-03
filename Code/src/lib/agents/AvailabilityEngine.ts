import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ProviderAvailability {
  provider_id: string;
  booking_id?: string;
  start_time: string;
  end_time: string;
  status: string;
}

export class AvailabilityEngineClass {
  async execute(requestId: string, providers: any[]): Promise<any[]> {
    console.log(`[AvailabilityEngine] Evaluating schedule availability for ${providers.length} candidates...`);

    if (providers.length === 0) return [];

    try {
      // 1. Fetch request target details (requested time)
      const { data: request, error: reqErr } = await supabase
        .from("requests")
        .select("requested_time, preferred_start_time, preferred_end_time, is_scheduled, service, location")
        .eq("id", requestId)
        .single();

      if (reqErr || !request) {
        console.warn("[AvailabilityEngine] Request not found or missing schedule details. Proceeding with default 'Now'.");
      }

      console.log(`[AvailabilityEngine] Detected time phrase: ${request?.requested_time || "Now"}`);
      console.log(`[AvailabilityEngine] Detected service: ${request?.service || "unknown"}`);
      console.log(`[AvailabilityEngine] Detected location: ${request?.location || "unknown"}`);

      let targetStart: Date;
      let targetEnd: Date;

      if (request?.is_scheduled && request?.preferred_start_time) {
        targetStart = new Date(request.preferred_start_time);
        targetEnd = request.preferred_end_time 
          ? new Date(request.preferred_end_time) 
          : new Date(targetStart.getTime() + 2 * 60 * 60 * 1000);
      } else {
        // Fallback to ASAP (current time)
        targetStart = new Date();
        targetEnd = new Date(targetStart.getTime() + 2 * 60 * 60 * 1000);
      }

      if (isNaN(targetStart.getTime())) {
        console.warn("[AvailabilityEngine] Resolved target start date is invalid, defaulting to current time.");
        targetStart = new Date();
        targetEnd = new Date(targetStart.getTime() + 2 * 60 * 60 * 1000);
      }
      
      console.log(`[AvailabilityEngine] Resolved time window: ${targetStart.toISOString()} - ${targetEnd.toISOString()}`);

      const startOfDay = new Date(targetStart.getFullYear(), targetStart.getMonth(), targetStart.getDate()).toISOString();
      const endOfDay = new Date(targetStart.getFullYear(), targetStart.getMonth(), targetStart.getDate(), 23, 59, 59).toISOString();

      // 2. Query availability conflicts & workloads for all candidate provider IDs
      const providerIds = providers.map(p => p.id);

      // Attempt to query provider_availability
      let availabilityRecords: any[] = [];
      let missingTable = false;

      try {
        const { data: avail, error: availErr } = await supabase
          .from("provider_availability")
          .select("*")
          .in("provider_id", providerIds)
          .gte("end_time", startOfDay)
          .lte("start_time", endOfDay);

        if (availErr) {
          throw availErr;
        }
        availabilityRecords = avail || [];
      } catch (err: any) {
        // If the table does not exist, fall back to checking the bookings table
        console.warn("[AvailabilityEngine] provider_availability table query failed. Falling back to bookings table.", err.message);
        missingTable = true;
      }

      // If missing table or no records, query bookings table for today to build dynamic schedule blocks
      let bookingRecords: any[] = [];
      try {
        const { data: bData, error: bErr } = await supabase
          .from("bookings")
          .select("provider_id, scheduled_time, status")
          .in("provider_id", providerIds)
          .gte("scheduled_time", startOfDay)
          .lte("scheduled_time", endOfDay);

        if (!bErr && bData) {
          bookingRecords = bData;
        }
      } catch (bErr) {
        console.error("[AvailabilityEngine] Fallback bookings query failed:", bErr);
      }

      // Convert bookings records into mock availability slots if missingTable is true
      if (missingTable && bookingRecords.length > 0) {
        availabilityRecords = bookingRecords.map(b => {
          const startTime = new Date(b.scheduled_time);
          const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours
          return {
            provider_id: b.provider_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: b.status || "busy"
          };
        });
      }

      // 3. Filter providers and calculate real-time workloads
      const availableProviders: any[] = [];

      for (const provider of providers) {
        const providerId = provider.id;

        // Fetch capacity specs (default values if columns do not exist in providers table yet)
        const dailyCapacity = provider.daily_capacity || provider.max_daily_jobs || 5;
        const maxParallel = provider.max_parallel_jobs || 1;

        // Schedule blocks specific to this provider
        const mySchedule = availabilityRecords.filter(r => r.provider_id === providerId);

        // Daily workload count (non-cancelled, non-rejected bookings for today)
        const activeBookings = bookingRecords.filter(b => 
          b.provider_id === providerId && 
          b.status !== "cancelled" && 
          b.status !== "rejected"
        );
        const workloadCount = activeBookings.length;

        // Conflict check: check if any schedule block overlaps with target interval
        let hasConflict = false;
        for (const slot of mySchedule) {
          const slotStart = new Date(slot.start_time);
          const slotEnd = new Date(slot.end_time);

          const isOverlapping = slotStart < targetEnd && slotEnd > targetStart;
          if (isOverlapping && slot.status !== "cancelled" && slot.status !== "rejected") {
            hasConflict = true;
            break;
          }
        }

        // Parallel jobs limit check
        const concurrentJobs = mySchedule.filter(slot => {
          const slotStart = new Date(slot.start_time);
          const slotEnd = new Date(slot.end_time);
          return slotStart < targetEnd && slotEnd > targetStart && slot.status !== "cancelled" && slot.status !== "rejected";
        }).length;

        const isOverloaded = workloadCount >= dailyCapacity;
        const isParallelLimitExceeded = concurrentJobs >= maxParallel;

        if (hasConflict || isOverloaded || isParallelLimitExceeded) {
          let reasons = [];
          if (hasConflict) reasons.push("scheduling conflict detected");
          if (isOverloaded) reasons.push(`daily job capacity overloaded (${workloadCount}/${dailyCapacity})`);
          if (isParallelLimitExceeded) reasons.push(`parallel assignment limit exceeded (${concurrentJobs}/${maxParallel})`);
          console.warn(`[AvailabilityEngine] Reason provider filtered: Provider ${providerId} filtered out due to: ${reasons.join(", ")}`);
          continue;
        }

        // Attach active workload to provider for matrix ranker scoring weight (workloadScore)
        availableProviders.push({
          ...provider,
          active_workload: workloadCount,
          availability: "available"
        });
      }

      if (availableProviders.length === 0) {
        console.warn(`[AvailabilityEngine] Available providers count: 0. Standby fallback triggered.`);
        const standbyProviders = providers.map(p => {
          const providerId = p.id;
          const activeBookings = bookingRecords.filter(b => 
            b.provider_id === providerId && 
            b.status !== "cancelled" && 
            b.status !== "rejected"
          );
          return {
            ...p,
            active_workload: activeBookings.length,
            availability: "standby"
          };
        });
        console.log(`[AvailabilityEngine] Available providers count: ${standbyProviders.length} (standby)`);
        return standbyProviders;
      }

      console.log(`[AvailabilityEngine] Available providers count: ${availableProviders.length}`);
      return availableProviders;

    } catch (err: any) {
      console.error("[AvailabilityEngine] Unexpected error inside availability engine:", err);
      // Fail-open strategy: return raw providers list with workload 0 to avoid breaking orchestration
      return providers.map(p => ({ ...p, active_workload: 0, availability: "standby" }));
    }
  }
}

const instance = new AvailabilityEngineClass();
export default instance;
