import { create } from 'zustand';
import { Provider } from '@/types/database';

export type { Provider };

export type AgentStatus = 'IDLE' | 'ACTIVE' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'QUEUED';

export interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  description: string;
}

export interface TraceLog {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

interface AetherStore {
  // Request State
  requestText: string;
  setRequestText: (text: string) => void;
  currentRequestId: string | null;
  setCurrentRequestId: (id: string | null) => void;
  currentBookingId: string | null;
  setCurrentBookingId: (id: string | null) => void;
  
  // Extraction State
  extractedData: {
    service: string | null;
    location: string | null;
    time: string | null;
    priority: string | null;
  };
  setExtractedData: (data: Partial<AetherStore['extractedData']>) => void;

  // Agent State
  agents: AgentState[];
  updateAgentStatus: (id: string, status: AgentStatus, progress?: number) => void;
  resetAgents: () => void;

  // Providers
  providers: Provider[];
  setProviders: (providers: Provider[]) => void;
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;

  // Workflow & Booking State
  workflowStatus: 'INTAKE' | 'ORCHESTRATING' | 'MATCHED' | 'BOOKED' | 'TRACKING' | 'COMPLETED';
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'SCHEDULED' | 'CANCELLED';
  trackingStatus: 'IDLE' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS';
  setWorkflowStatus: (status: AetherStore['workflowStatus']) => void;
  setBookingStatus: (status: AetherStore['bookingStatus']) => void;
  setTrackingStatus: (status: AetherStore['trackingStatus']) => void;

  // Trace Logs
  traceLogs: TraceLog[];
  addTraceLog: (log: Omit<TraceLog, 'id'>) => void;

  // Demo Mode (Module 7)
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

export const useStore = create<AetherStore>((set) => ({
  requestText: '',
  setRequestText: (text) => set({ requestText: text }),
  currentRequestId: null,
  setCurrentRequestId: (id) => set({ currentRequestId: id }),
  currentBookingId: null,
  setCurrentBookingId: (id) => set({ currentBookingId: id }),

  extractedData: {
    service: null,
    location: null,
    time: null,
    priority: null,
  },
  setExtractedData: (data) => set((state) => ({
    extractedData: { ...state.extractedData, ...data }
  })),

  agents: [
    { id: '1', name: 'Intent Agent', status: 'IDLE', progress: 0, description: 'Extracting service and intent...' },
    { id: '2', name: 'Location Agent', status: 'IDLE', progress: 0, description: 'Mapping service grid...' },
    { id: '3', name: 'Provider Agent', status: 'IDLE', progress: 0, description: 'Scanning provider network...' },
    { id: '4', name: 'Ranking Agent', status: 'IDLE', progress: 0, description: 'Evaluating quality metrics...' },
    { id: '5', name: 'Booking Agent', status: 'IDLE', progress: 0, description: 'Creating secure booking record...' },
    { id: '6', name: 'Assignment Agent', status: 'IDLE', progress: 0, description: 'Assigning dynamic provider...' },
    { id: '7', name: 'Trace Agent', status: 'IDLE', progress: 0, description: 'Logging secure system trace...' },
  ],
  updateAgentStatus: (id, status, progress) => set((state) => ({
    agents: state.agents.map((a) => a.id === id ? { ...a, status, progress: progress ?? a.progress } : a)
  })),
  resetAgents: () => set((state) => ({
    agents: state.agents.map((a) => ({ ...a, status: 'IDLE', progress: 0 }))
  })),

  providers: [],
  setProviders: (providers) => set({ providers }),
  selectedProvider: null,
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  workflowStatus: 'INTAKE',
  bookingStatus: 'PENDING',
  trackingStatus: 'IDLE',
  setWorkflowStatus: (status) => set({ workflowStatus: status }),
  setBookingStatus: (status) => set({ bookingStatus: status }),
  setTrackingStatus: (status) => set({ trackingStatus: status }),

  traceLogs: [],
  addTraceLog: (log) => set((state) => ({
    traceLogs: [...state.traceLogs, { ...log, id: Math.random().toString(36).substring(2, 9) }]
  })),

  demoMode: false,
  setDemoMode: (val) => set({ demoMode: val }),
}));
