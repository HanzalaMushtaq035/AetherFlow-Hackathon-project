export interface Request {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  status: string;
}

export interface Booking {
  id: string;
  requestId: string;
  providerId: string;
  status: string;
}

export interface Trace {
  id: string;
  action: string;
  timestamp: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
}

export interface RankingResult {
  providerId: string;
  score: number;
}

export interface AgentResult {
  success: boolean;
  message: string;
  data?: any;
}
