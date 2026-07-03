import IntentAgentInstance from "./IntentAgent";

export interface ExtractedIntent {
  service: string;
  location: string | null;
  problem: string | null;
  time: string | null;
  priority: string;
  reasoning: string;
  preferred_start_time: string | null;
  preferred_end_time: string | null;
  is_scheduled: boolean;
  confidence: number;
}

export const IntentAgent = {
  async extract(query: string): Promise<ExtractedIntent> {
    const res = await IntentAgentInstance.execute(query);
    return {
      service: res.service,
      location: res.location,
      problem: res.problem || null,
      time: res.requested_time,
      priority: res.priority,
      reasoning: `Linguistic analysis resolved service as '${res.service}' with ${Math.round((res.confidence || 0.45) * 100)}% confidence.`,
      preferred_start_time: res.preferred_start_time || null,
      preferred_end_time: res.preferred_end_time || null,
      is_scheduled: !!res.is_scheduled,
      confidence: res.confidence || 0.45
    };
  }
};
