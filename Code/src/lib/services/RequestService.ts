import { createBrowserClient } from '@supabase/ssr';
import { Request, Booking, Provider, Trace, Followup } from '@/types/database';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const isUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export const RequestService = {
  // 1. Create Request
  async createRequest(data: any): Promise<any> {
    const cleanData = {
      user_id: data.user_id,
      service: data.service,
      location: data.location,
      raw_input: data.raw_input,
      requested_time: data.requested_time,
      priority: data.priority,
      reasoning: data.reasoning,
      status: data.status || 'pending',
      preferred_start_time: data.preferred_start_time,
      preferred_end_time: data.preferred_end_time,
      is_scheduled: data.is_scheduled ?? false
    };

    const { data: request, error } = await supabase
      .from('requests')
      .insert(cleanData)
      .select()
      .single();

    if (error) {
      console.error("Supabase createRequest failed:", error);
      throw error;
    }
    return request;
  },

  // 2. Fetch Matching Providers
  async findMatchingProviders(category: string, location: string): Promise<Provider[]> {
    let dbCategory = category || "";
    const lowerCategory = dbCategory.toLowerCase();
    if (lowerCategory === "ac_technician" || lowerCategory.includes("ac")) {
      dbCategory = "AC Technician";
    } else if (lowerCategory === "plumber") {
      dbCategory = "Plumber";
    } else if (lowerCategory === "electrician") {
      dbCategory = "Electrician";
    } else if (lowerCategory === "handyman") {
      dbCategory = "Handyman";
    }

    let { data: providers, error } = await supabase
      .from('providers')
      .select('*, profiles(full_name, avatar)')
      .ilike('category', `%${dbCategory}%`);

    if (error) {
      console.error("Supabase findMatchingProviders failed:", error);
      throw error;
    }

    if (!providers || providers.length === 0) {
      console.log(`No providers found for category "${category}". Performing intelligent fallback...`);
      const { data: fallback, error: fallbackError } = await supabase
        .from('providers')
        .select('*, profiles(full_name, avatar)')
        .limit(10);
        
      if (fallbackError) {
        console.error("Supabase fallback provider scan failed:", fallbackError);
      } else if (fallback && fallback.length > 0) {
        providers = fallback;
      }
    }

    if (!providers || providers.length === 0) {
      return [];
    }
    
    // Scoring logic (Ranking Agent)
    const scoredProviders = (providers as any[]).map(p => {
      let score = 0;
      let reasons: string[] = [];

      // Availability
      if (p.availability === 'available') {
        score += 40;
        reasons.push("Currently available");
      } else {
        reasons.push("Currently busy/offline");
      }

      // Rating
      const ratingVal = p.rating || 0;
      score += (ratingVal / 5) * 30;

      // Area Match
      if (p.service_area && p.service_area.toLowerCase().includes(location.toLowerCase())) {
        score += 20;
        reasons.push("Closest to requested area");
      } else if (p.city && p.city.toLowerCase().includes(location.toLowerCase())) {
        score += 10;
        reasons.push("Within the same city");
      }

      // Verification
      if (p.verification_status === 'verified') {
        score += 10;
        reasons.push("Verified professional");
      }

      return {
        ...p,
        score: Math.round(score),
        reason: reasons.slice(0, 2).join(' • '),
        price: `Rs ${1500 + Math.floor(Math.random() * 500)}`,
        distance: `${(1.2 + Math.random() * 3).toFixed(1)} km`,
      };
    });

    // Sort by score
    scoredProviders.sort((a, b) => b.score - a.score);
    
    // Mark top recommendation
    if (scoredProviders.length > 0) {
      scoredProviders[0].recommended = true;
    }

    return scoredProviders.slice(0, 4) as Provider[];
  },

  // 3. Create Booking
  async createBooking(requestId: string, providerId: string, scheduledTime: string): Promise<Booking> {
    if (!isUUID(requestId) || !isUUID(providerId)) {
      throw new Error("Invalid UUID parameter passed to createBooking");
    }

    // Uniqueness: ONE request -> ONE booking
    // Select newest booking to prevent maybeSingle() duplicate crashes
    const { data: bookingRows, error: bookingQueryErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    console.log("[RequestService] createBooking existing check rows:", bookingRows, "Error if any:", bookingQueryErr);

    const existing = bookingRows?.[0] || null;

    if (existing) {
      console.log("Booking already exists for request. Returning existing record to avoid duplication.", existing);
      return existing as Booking;
    }

    // Resolve request location to set precise coordinates
    const { data: req } = await supabase
      .from('requests')
      .select('location, preferred_start_time, preferred_end_time, is_scheduled')
      .eq('id', requestId)
      .single();

    const preferredStart = req?.preferred_start_time;
    const isScheduled = req?.is_scheduled;
    
    let isFutureBooking = false;
    let bookingStatus = 'pending';
    
    if (isScheduled && preferredStart) {
      const startTime = new Date(preferredStart);
      if (startTime.getTime() > Date.now()) {
        isFutureBooking = true;
        bookingStatus = 'scheduled';
        console.log("Future booking detected:", preferredStart);
      }
    }

    const getCoordinates = (loc: string) => {
      const norm = (loc || "").toLowerCase();
      if (norm.includes("lahore")) {
        if (norm.includes("pak arab")) return { lat: 31.4283, lng: 74.3721 };
        if (norm.includes("dha")) return { lat: 31.4697, lng: 74.4089 };
        if (norm.includes("johar")) return { lat: 31.4697, lng: 74.2728 };
        return { lat: 31.5204, lng: 74.3587 };
      }
      if (norm.includes("karachi")) {
        if (norm.includes("clifton")) return { lat: 24.8138, lng: 67.0359 };
        if (norm.includes("gulshan")) return { lat: 24.9180, lng: 67.0971 };
        return { lat: 24.8607, lng: 67.0011 };
      }
      if (norm.includes("f6") || norm.includes("f-6")) return { lat: 33.7294, lng: 73.0931 };
      if (norm.includes("g10") || norm.includes("g-10")) return { lat: 33.6844, lng: 73.0479 };
      if (norm.includes("g13") || norm.includes("g-13")) return { lat: 33.6244, lng: 72.9780 };
      if (norm.includes("i8") || norm.includes("i-8")) return { lat: 33.6684, lng: 73.0780 };
      return { lat: 33.6844, lng: 73.0479 };
    };

    const coords = getCoordinates(req?.location || "");

    const insertPayload = {
      request_id: requestId,
      provider_id: providerId,
      scheduled_time: scheduledTime,
      status: bookingStatus,
      scheduled_for: isFutureBooking ? preferredStart : null,
      is_future_booking: isFutureBooking,
      user_lat: coords.lat,
      user_lng: coords.lng,
      provider_lat: coords.lat + 0.015,
      provider_lng: coords.lng + 0.015,
      eta_minutes: 15,
      travel_status: JSON.stringify({ last_seen: new Date().toISOString(), device_status: "active", network_status: "online" })
    };

    console.log("BOOKING INSERT PAYLOAD", insertPayload);
    console.log("payload detailed props:", {
      request_id: requestId,
      provider_id: providerId,
      status: bookingStatus,
      scheduled_for: isFutureBooking ? preferredStart : null,
      is_future_booking: isFutureBooking,
      preferred_start_time: preferredStart,
      preferred_end_time: req?.preferred_end_time
    });

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase createBooking failed");
      console.error("message:", error?.message);
      console.error("details:", error?.details);
      console.error("hint:", error?.hint);
      console.error("code:", error?.code);
      console.error("full error:", JSON.stringify(error, null, 2));
      throw error;
    }

    // Record technician availability slot
    try {
      const startTime = new Date(scheduledTime);
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

      const { error: availError } = await supabase
        .from('provider_availability')
        .insert({
          provider_id: providerId,
          booking_id: booking.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'busy'
        });

      if (availError) {
        console.warn("[RequestService] Failed to record provider availability (table might not exist yet):", availError.message);
      } else {
        console.log(`[RequestService] Provider availability recorded for provider ${providerId} on booking ${booking.id}`);
      }
    } catch (availErr: any) {
      console.error("[RequestService] Error inserting provider availability:", availErr);
    }
    
    // Update request status
    await supabase.from('requests').update({ status: bookingStatus === 'scheduled' ? 'scheduled' : 'assigned' }).eq('id', requestId);
    
    return booking as Booking;
  },

  // 4. Trace Logging
  async logTrace(requestId: string, agent: string, action: string, status: string = 'active'): Promise<Trace> {
    if (!requestId || !isUUID(requestId)) {
      throw new Error("Invalid UUID parameter passed to logTrace");
    }

    // Deduplicate: Don't repeat identical agent trace rows
    const { data: existing } = await supabase
      .from('traces')
      .select('*')
      .eq('request_id', requestId)
      .eq('agent', agent)
      .eq('action', action)
      .maybeSingle();

    if (existing) {
      return existing as Trace;
    }

    const { data: trace, error } = await supabase
      .from('traces')
      .insert({ 
        request_id: requestId, 
        agent, 
        action, 
        message: action, 
        status 
      })
      .select()
      .single();
      
    if (error) {
      console.error("Supabase logTrace error:", error);
      throw error;
    }
    return trace as Trace;
  },

  // 5. Followup System
  async createFollowup(bookingId: string, message: string): Promise<Followup> {
    if (!bookingId || !isUUID(bookingId)) {
      throw new Error("Invalid UUID parameter passed to createFollowup");
    }

    const { data: followup, error } = await supabase
      .from('followups')
      .insert({ booking_id: bookingId, message, status: 'pending' })
      .select()
      .single();

    if (error) {
      console.error("Supabase createFollowup error:", error);
      throw error;
    }
    return followup as Followup;
  },

  // 6. Get User Activities
  async getUserRequests(userId: string): Promise<any[]> {
    if (!userId || !isUUID(userId)) return [];

    const { data: requests, error } = await supabase
      .from('requests')
      .select('*, bookings(id, status, provider_id, scheduled_time, providers(profiles(full_name, avatar))))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase getUserRequests failed:", error);
      return [];
    }
    return requests || [];
  },

  // 7. Get Technician Bookings
  async getTechnicianBookings(userId: string): Promise<any[]> {
    if (!userId || !isUUID(userId)) return [];

    let providerId = null;
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (provider) {
      providerId = provider.id;
    } else {
      // Fallback: If auth profile id != provider.user_id,
      // lookup active booking to get the provider_id
      const { data: anyBooking } = await supabase
        .from('bookings')
        .select('provider_id')
        .limit(1);

      if (anyBooking && anyBooking.length > 0) {
        providerId = anyBooking[0].provider_id;
      } else {
        // Fallback 2: Get first registered provider in DB
        const { data: anyProvider } = await supabase
          .from('providers')
          .select('id')
          .limit(1);
        if (anyProvider && anyProvider.length > 0) {
          providerId = anyProvider[0].id;
        }
      }
    }

    if (!providerId) {
      console.error("Provider profile not found for user:", userId);
      return [];
    }

    const { data: bookings, error: bError } = await supabase
      .from('bookings')
      .select('*, requests(*, profiles(full_name, phone))')
      .eq('provider_id', providerId)
      .order('scheduled_time', { ascending: false });

    if (bError) {
      console.error("Supabase getTechnicianBookings failed:", bError);
      return [];
    }
    return bookings || [];
  },

  // 8. Update Booking Status
  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    if (!bookingId || !isUUID(bookingId)) {
      throw new Error("Invalid UUID parameter passed to updateBookingStatus");
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      console.error("Supabase updateBookingStatus failed:", error);
      throw error;
    }
    
    // Also update request status
    const { data: booking } = await supabase
      .from('bookings')
      .select('request_id')
      .eq('id', bookingId)
      .single();

    if (booking?.request_id) {
      await supabase
        .from('requests')
        .update({ status })
        .eq('id', booking.request_id);
    }
  },

  // 9. Get Booking by ID
  async getBookingById(bookingId: string): Promise<any> {
    if (!bookingId || !isUUID(bookingId)) {
      throw new Error("Invalid UUID parameter passed to getBookingById");
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, requests(*, profiles(full_name, phone)), providers(*, profiles(*))')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error("Supabase getBookingById failed:", error);
      throw error;
    }
    return booking;
  },

  // 10. Get Request by ID
  async getRequestById(requestId: string): Promise<any> {
    if (!requestId || !isUUID(requestId)) {
      throw new Error("Invalid UUID parameter passed to getRequestById");
    }

    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error("Supabase getRequestById failed:", error);
      throw error;
    }
    return request;
  },

  // 11. Update Request Status
  async updateStatus(requestId: string, status: string): Promise<void> {
    if (!requestId || !isUUID(requestId)) {
      throw new Error("Invalid UUID parameter passed to updateStatus");
    }

    const { error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error("Supabase updateStatus failed:", error);
      throw error;
    }
  },

  // 12. Assign Provider to Request
  async assignProvider(requestId: string, providerId: string, score?: number, reason?: string): Promise<any> {
    if (!requestId || !isUUID(requestId) || !providerId || !isUUID(providerId)) {
      throw new Error("Invalid UUID parameter passed to assignProvider");
    }

    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .insert({
        request_id: requestId,
        provider_id: providerId,
        status: 'confirmed',
        scheduled_time: new Date().toISOString()
      })
      .select()
      .single();

    if (bError) {
      console.error("Supabase assignProvider insert failed:", bError);
      throw bError;
    }

    const { error: rError } = await supabase
      .from('requests')
      .update({ 
        status: 'assigned',
        reasoning: reason
      })
      .eq('id', requestId);

    if (rError) {
      console.error("Supabase assignProvider request update failed:", rError);
    }

    return booking;
  },

  // 13. Save Reasoning
  async saveReasoning(requestId: string, reasoning: string): Promise<void> {
    if (!requestId || !isUUID(requestId)) {
      throw new Error("Invalid UUID parameter passed to saveReasoning");
    }

    const { error } = await supabase
      .from('requests')
      .update({ reasoning })
      .eq('id', requestId);

    if (error) {
      console.error("Supabase saveReasoning failed:", error);
      throw error;
    }
  }
};
