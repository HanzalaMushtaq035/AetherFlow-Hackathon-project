import IntentAgent from "./IntentAgent";
import LocationAgent from "./LocationAgent";
import ProviderAgent from "./ProviderAgent";
import RankingAgent from "./RankingAgent";
import BookingAgent from "./BookingAgent";
import AssignmentAgent from "./AssignmentAgent";
import TraceAgent from "./TraceAgent";

export class OrchestratorAgent {
  async execute(requestId: string, input: string, location: string, time: string) {
    console.log("ORCHESTRATION_START");
    // 1. IntentAgent
    console.log("INTENT_START");
    const intent = await IntentAgent.execute(input);
    
    // 2. LocationAgent
    console.log("LOCATION_START");
    const loc = await LocationAgent.execute(requestId, location || intent.location);
    
    // 3. ProviderAgent
    console.log("PROVIDER_START");
    const providers = await ProviderAgent.execute(requestId, intent.service, loc.location);
    console.log("SCHEDULING_START");
    
    // 4. RankingAgent
    console.log("RANKING_START");
    const ranked = await RankingAgent.execute(requestId, providers, intent.service, loc.location);
    
    if (ranked.length === 0) {
      throw new Error("No service providers found for this service and location");
    }
    const topProvider = ranked[0];
    
    // 5. BookingAgent
    console.log("BOOKING_START");
    const booking = await BookingAgent.execute(requestId, topProvider.id, time || intent.requested_time || new Date().toISOString());
    
    // 6. AssignmentAgent
    const assignment = await AssignmentAgent.execute(requestId, booking.id, topProvider.profiles?.full_name || "Technician");
    
    // 7. TraceAgent
    await TraceAgent.execute(requestId, "Autonomous Orchestration Finalized");
    
    return {
      intent,
      location: loc,
      providers: ranked,
      booking,
      assignment
    };
  }
}

export default new OrchestratorAgent();