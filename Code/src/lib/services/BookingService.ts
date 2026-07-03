import { createBrowserClient } from '@supabase/ssr';
import { Booking } from '@/types/database';
import TraceService from './TraceService';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class BookingService {
  // Create a booking
  async create(data: any): Promise<Booking> {
    if (data.request_id) {
      // Uniqueness protection: ONE request -> ONE booking
      const { data: existing } = await supabase
        .from('bookings')
        .select('*')
        .eq('request_id', data.request_id)
        .maybeSingle();

      if (existing) {
        console.log("Booking already exists for request. Returning existing record to avoid duplication.", existing);
        return existing as Booking;
      }
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .select()
      .single();
    if (error) {
      console.error("BookingService create failed:", error);
      throw error;
    }
    return booking as Booking;
  }

  // Update Booking Status & Technician Status
  async updateStatus(id: string, status: string): Promise<Booking> {
    if (!id) {
      throw new Error("Cannot update booking status: booking ID is required");
    }

    // Completion Lock: Reject transitions if already completed (TASK 6)
    try {
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (currentBooking && (currentBooking.status === 'completed' || currentBooking.technician_status === 'completed')) {
        const blockedStatuses = ['accepted', 'en_route', 'arrived', 'working'];
        if (blockedStatuses.includes(status)) {
          console.warn(`[BookingService] Booking ${id} is locked in completed state. Rejecting transition to ${status}.`);
          return currentBooking as Booking;
        }
      }
    } catch (e) {
      console.error("Failed to query booking lock status:", e);
    }

    // Determine device status based on operational status
    let device_status = 'active';
    const network_status = 'online';
    if (status === 'completed' || status === 'cancelled' || status === 'rejected') {
      device_status = 'idle';
    } else if (status === 'working') {
      device_status = 'working';
    } else if (status === 'en_route') {
      device_status = 'moving';
    }

    // Fetch booking request location first
    let requestLoc = 'Islamabad';
    try {
      const { data: bookingDetail } = await supabase
        .from('bookings')
        .select('*, requests(*)')
        .eq('id', id)
        .maybeSingle();
      if (bookingDetail?.requests?.location) {
        requestLoc = bookingDetail.requests.location;
      }
    } catch (e) {
      console.error("Failed to query booking detail for location resolution:", e);
    }

    const getCoordinates = (loc: string) => {
      const norm = (loc || "").toLowerCase();
      if (norm.includes("lahore")) return { lat: 31.5204, lng: 74.3587 };
      if (norm.includes("karachi")) return { lat: 24.8607, lng: 67.0011 };
      if (norm.includes("f6") || norm.includes("f-6")) return { lat: 33.7294, lng: 73.0931 };
      if (norm.includes("g10") || norm.includes("g-10")) return { lat: 33.6844, lng: 73.0479 };
      if (norm.includes("g13") || norm.includes("g-13")) return { lat: 33.6244, lng: 72.9780 };
      return { lat: 33.6844, lng: 73.0479 };
    };

    const destCoords = getCoordinates(requestLoc);
    const startLat = destCoords.lat + 0.015;
    const startLng = destCoords.lng + 0.015;

    // Prepare update payload
    const updateData: any = { 
      status, 
      technician_status: status,
      travel_status: JSON.stringify({
        last_seen: new Date().toISOString(),
        device_status,
        network_status
      })
    };

    // Initialize coordinates when status becomes accepted
    if (status === 'accepted') {
      updateData.current_lat = startLat;
      updateData.current_lng = startLng;
      updateData.route_progress = 0;
      updateData.eta_minutes = 15;
      updateData.user_lat = destCoords.lat;
      updateData.user_lng = destCoords.lng;
    }

    // 1. Update status and technician_status in bookings
    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (bError) {
      console.error("BookingService updateStatus failed:", bError);
      throw bError;
    }

      // 2. Update status in requests table
      if (booking?.request_id) {
        await supabase
          .from('requests')
          .update({ status })
          .eq('id', booking.request_id);

        // 3. Log Traces (Keep only specific whitelisted steps to reduce trace volume)
        let stepAction = '';
      let severity: 'INFO' | 'WARNING' | 'ERROR' | 'ACTION' = 'INFO';
      let reason = '';
      
      switch (status) {
        case 'accepted':
          stepAction = 'TECHNICIAN_ACCEPTED';
          severity = 'ACTION';
          reason = 'Technician matched and accepted the service request.';
          break;
        case 'en_route':
          stepAction = 'TECHNICIAN_EN_ROUTE';
          severity = 'ACTION';
          reason = 'Technician has started traveling towards target destination.';
          break;
        case 'arrived':
          stepAction = 'TECHNICIAN_ARRIVED';
          severity = 'ACTION';
          reason = 'Technician arrived at resident location.';
          break;
        case 'working':
          stepAction = 'TECHNICIAN_WORKING';
          severity = 'ACTION';
          reason = 'Technician started core maintenance operations.';
          break;
        case 'completed':
          stepAction = 'TECHNICIAN_COMPLETED';
          severity = 'INFO';
          reason = 'Mission completed successfully. Customer receipt and follow-up pending.';
          break;
        case 'cancelled':
        case 'rejected':
          stepAction = 'TECHNICIAN_REJECTED';
          severity = 'WARNING';
          reason = 'Technician rejected or cancelled the active booking.';
          break;
      }

      if (stepAction) {
        await TraceService.create(booking.request_id, 'TECHNICIAN_AGENT', stepAction, undefined, severity, reason);
      }
    }

    return booking as Booking;
  }

  // Update movement simulation details
  async updateMovement(
    id: string, 
    current_lat: number, 
    current_lng: number, 
    route_progress: number, 
    eta_minutes: number
  ): Promise<Booking> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        current_lat,
        current_lng,
        route_progress,
        eta_minutes,
        travel_status: JSON.stringify({
          last_seen: new Date().toISOString(),
          device_status: 'moving',
          network_status: 'online'
        })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("BookingService updateMovement failed:", error);
      throw error;
    }
    return booking as Booking;
  }

  // Get bookings by user ID (resident)
  async getByUser(userId: string): Promise<any[]> {
    if (!userId) return [];
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*, bookings(*)')
      .eq('user_id', userId);

    if (error) {
      console.error("BookingService getByUser failed:", error);
      return [];
    }

    const bookings: any[] = [];
    requests?.forEach(req => {
      if (req.bookings) {
        if (Array.isArray(req.bookings)) {
          bookings.push(...req.bookings);
        } else {
          bookings.push(req.bookings);
        }
      }
    });

    return bookings;
  }

  // Get active booking detail with request and provider relations
  async getBookingDetail(bookingId: string): Promise<any> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, requests(*, profiles(*)), providers(*, profiles(*))')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error("BookingService getBookingDetail failed:", error);
      throw error;
    }
    return booking;
  }

  // Save Orchestration Session (Live Agent Memory)
  async saveOrchestrationSession(requestId: string, sessionData: any): Promise<void> {
    if (!requestId) return;
    
    // 1. Dual-write to requests table
    const { error: rError } = await supabase
      .from('requests')
      .update({ reasoning: JSON.stringify(sessionData) })
      .eq('id', requestId);
    if (rError) {
      console.error("BookingService requests reasoning save failed:", rError);
    }

    // 2. Dual-write to orchestration_sessions table
    try {
      const payload: any = {
        request_id: requestId,
        booking_id: sessionData.booking_id || null,
        current_stage: sessionData.current_stage || 'INTENT',
        status: sessionData.status || 'ORCHESTRATING',
        timeline: JSON.stringify(sessionData),
        selected_provider: sessionData.assigned_provider || null,
        ranking_score: sessionData.ranking_score || 0.95,
        completed_stages: sessionData.completed_stages || [],
        candidate_providers: sessionData.candidate_providers || [],
        ranking_result: sessionData.ranking_result || [],
        assigned_provider: sessionData.assigned_provider || null,
        trace_ids: sessionData.trace_ids || [],
        updated_at: new Date().toISOString()
      };

      const { error: sError } = await supabase
        .from('orchestration_sessions')
        .upsert(payload, { onConflict: 'request_id' });

      if (sError) {
        console.error("BookingService orchestration_sessions save failed:", sError);
      }
    } catch (e) {
      console.error("Unexpected error saving to orchestration_sessions table:", e);
    }
  }

  // Get Orchestration Session
  async getOrchestrationSession(requestId: string): Promise<any | null> {
    if (!requestId) return null;

    // 1. Try reading from orchestration_sessions first
    try {
      const { data, error } = await supabase
        .from('orchestration_sessions')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (!error && data?.timeline) {
        try {
          const parsed = JSON.parse(data.timeline);
          return {
            ...parsed,
            booking_id: data.booking_id || parsed.booking_id,
            current_stage: data.current_stage || parsed.current_stage,
            completed_stages: data.completed_stages || parsed.completed_stages || [],
            candidate_providers: data.candidate_providers || parsed.candidate_providers || [],
            ranking_result: data.ranking_result || parsed.ranking_result || [],
            status: data.status || parsed.status,
            assigned_provider: data.assigned_provider || data.selected_provider || parsed.assigned_provider,
            ranking_score: data.ranking_score || parsed.ranking_score,
            trace_ids: data.trace_ids || parsed.trace_ids || [],
          };
        } catch (e) {
          // JSON parse failed
        }
      }
    } catch (e) {
      console.error("Failed to read from orchestration_sessions:", e);
    }

    // 2. Fall back to requests table reasoning column
    const { data: reqData, error: reqError } = await supabase
      .from('requests')
      .select('reasoning')
      .eq('id', requestId)
      .single();

    if (reqError || !reqData?.reasoning) return null;
    try {
      if (reqData.reasoning.trim().startsWith('{')) {
        const parsed = JSON.parse(reqData.reasoning);
        if (parsed && parsed.current_stage) {
          return parsed;
        }
      }
    } catch (e) {
      // Not a JSON string
    }
    return null;
  }

  // Update Technician Telemetry
  async updateTelemetry(bookingId: string, telemetry: { last_seen: string; device_status: string; network_status: string }): Promise<void> {
    if (!bookingId) return;
    const { error } = await supabase
      .from('bookings')
      .update({ travel_status: JSON.stringify(telemetry) })
      .eq('id', bookingId);
    if (error) {
      console.error("BookingService updateTelemetry failed:", error);
    }
  }

  // Get Technician Telemetry
  async getTelemetry(bookingId: string): Promise<{ last_seen: string; device_status: string; network_status: string }> {
    if (!bookingId) {
      return {
        last_seen: new Date().toISOString(),
        device_status: 'active',
        network_status: 'online'
      };
    }
    const { data, error } = await supabase
      .from('bookings')
      .select('travel_status')
      .eq('id', bookingId)
      .single();
    if (error || !data?.travel_status) {
      return {
        last_seen: new Date().toISOString(),
        device_status: 'active',
        network_status: 'online'
      };
    }
    try {
      if (data.travel_status.trim().startsWith('{')) {
        return JSON.parse(data.travel_status);
      }
    } catch (e) {
      // Fallback
    }
    return {
      last_seen: new Date().toISOString(),
      device_status: 'active',
      network_status: 'online'
    };
  }
}

const serviceInstance = new BookingService();
export default serviceInstance;