import { createBrowserClient } from '@supabase/ssr';
import TraceService from './TraceService';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface NarratorEvent {
  id: string;
  request_id: string;
  message: string;
  stage: string;
  created_at: string;
}

export class NarratorService {
  // Append narrator event (persists to demo_logs or virtual traces fallback)
  async appendEvent(requestId: string, message: string, stage: string, preFetchedEvents?: NarratorEvent[]): Promise<void> {
    if (!requestId || !message) return;

    // Check if duplicate comment already exists to avoid clutter
    const existingEvents = preFetchedEvents || await this.getEvents(requestId);
    const isDuplicate = existingEvents.some(e => e.message === message);
    if (isDuplicate) return;

    // 1. Try storing in demo_logs
    try {
      const { error } = await supabase
        .from('demo_logs')
        .insert({
          request_id: requestId,
          message,
          stage,
          created_at: new Date().toISOString()
        });

      if (!error) return; // Success
    } catch (e) {
      // Catch and fall through to trace fallback
    }

    // 2. Fallback: Log to traces table as NARRATOR_AGENT
    try {
      await TraceService.create(
        requestId,
        'NARRATOR_AGENT',
        message,
        undefined,
        'INFO',
        stage
      );
    } catch (e) {
      console.error("Narrator fallback to traces failed:", e);
    }
  }

  // Retrieve all narrator events for a request
  async getEvents(requestId: string): Promise<NarratorEvent[]> {
    if (!requestId) return [];

    // 1. Try loading from demo_logs
    try {
      const { data, error } = await supabase
        .from('demo_logs')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as NarratorEvent[];
      }
    } catch (e) {
      // Fall through to trace fallback
    }

    // 2. Fallback: Retrieve virtual traces from NARRATOR_AGENT
    try {
      const dbTraces = await TraceService.getByRequest(requestId);
      const narratorTraces = dbTraces.filter((t: any) => t.agent === 'NARRATOR_AGENT');
      
      return narratorTraces.map((t: any) => ({
        id: t.id,
        request_id: t.request_id,
        message: t.parsedAction || t.action,
        stage: t.reason || 'ORCHESTRATION',
        created_at: t.created_at
      }));
    } catch (e) {
      console.error("Narrator getEvents fallback failed:", e);
      return [];
    }
  }

  // Generate dynamic narration based on live traces & booking state
  async autoNarrate(requestId: string, bookingState: any, sessionState: any, preFetchedTraces?: any[]): Promise<void> {
    if (!requestId) return;

    const traces = preFetchedTraces || await TraceService.getByRequest(requestId);
    const existingEvents = await this.getEvents(requestId);
    
    // Helper to append unique events using the fetched list
    const append = async (msg: string, stage: string) => {
      // Check duplicate locally first to avoid DB insert attempt
      const isDuplicate = existingEvents.some(e => e.message === msg);
      if (isDuplicate) return;
      await this.appendEvent(requestId, msg, stage, existingEvents);
    };
    
    // Map of agents and their trigger events
    const hasIntent = traces.some(t => t.agent === 'INTENT_AGENT');
    const hasLocation = traces.some(t => t.agent === 'LOCATION_AGENT');
    const hasProviders = traces.some(t => t.agent === 'PROVIDER_AGENT');
    const hasRanking = traces.some(t => t.agent === 'RANKING_AGENT');
    const hasBooking = traces.some(t => t.agent === 'BOOKING_AGENT');
    const hasAssignment = traces.some(t => t.agent === 'ASSIGNMENT_AGENT');

    // 1. Intent Agent narration
    if (hasIntent) {
      const service = sessionState?.intent || bookingState?.requests?.service || "specialist";
      await append(
        `Intent Agent parsed natural text and identified standard category: ${service}.`, 
        'INTENT'
      );
    }

    // 2. Location Agent narration
    if (hasLocation) {
      const loc = sessionState?.sector || bookingState?.requests?.location || "target sector";
      await append(
        `Location Agent queried geocoordinates for sector: ${loc}.`, 
        'LOCATION'
      );
    }

    // 3. Provider Discovery narration
    if (hasProviders) {
      const count = sessionState?.candidate_providers?.length || 3;
      await append(
        `Provider Agent discovered ${count} verified candidates active nearby.`, 
        'PROVIDER'
      );
    }

    // 4. Ranking consensus narration
    if (hasRanking) {
      const providerName = bookingState?.providers?.profiles?.full_name || "highest-ranked technician";
      await append(
        `Ranking Agent evaluated performance scoring matrices and designated candidate: ${providerName}.`, 
        'RANKING'
      );
    }

    // 5. Booking Agent narration
    if (hasBooking) {
      await append(
        `Booking Agent locked active dispatch protocol inside database.`, 
        'BOOKING'
      );
    }

    // 6. Assignment Agent narration
    if (hasAssignment) {
      await append(
        `Assignment Agent dispatched request payload to technician device terminals.`, 
        'ASSIGNMENT'
      );
    }

    // 7. Travel Status state-based narration
    if (bookingState) {
      const status = bookingState.status;
      const eta = bookingState.eta_minutes || 10;
      
      if (status === 'accepted') {
        await append(
          `Technician reviewed dispatch credentials and accepted request.`, 
          'TRAVEL'
        );
      } else if (status === 'en_route') {
        let shouldAppend = true;
        const lastTravelEvent = [...existingEvents]
          .reverse()
          .find(e => e.stage === 'TRAVEL' && e.message.includes('Dynamic ETA'));
        
        if (lastTravelEvent) {
          const match = lastTravelEvent.message.match(/computed at (\d+) minutes/);
          if (match) {
            const lastEta = parseInt(match[1], 10);
            if (Math.abs(eta - lastEta) < 3) {
              shouldAppend = false;
            }
          }
        }

        if (shouldAppend) {
          await append(
            `Technician en route to location. Dynamic ETA computed at ${eta} minutes.`, 
            'TRAVEL'
          );
        }
      } else if (status === 'arrived') {
        await append(
          `Technician arrived at target resident node coordinates.`, 
          'ARRIVAL'
        );
      } else if (status === 'working') {
        await append(
          `Technician established maintenance workspace. Core operations ongoing.`, 
          'WORK'
        );
      } else if (status === 'completed') {
        await append(
          `Fulfillment completed. Diagnostic feedback loops closed.`, 
          'COMPLETED'
        );
      }
    }
  }
}

const narratorInstance = new NarratorService();
export default narratorInstance;
