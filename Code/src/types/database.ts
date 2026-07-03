export type UserRole = 'resident' | 'technician' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar: string | null;
  created_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  category: string;
  rating: number;
  availability: 'available' | 'busy' | 'offline';
  location: string;
  specialization: string | null;
  experience_years: number | null;
  completed_jobs: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  service_radius: number | null; // in km
  // Joined fields from Profile
  profiles?: {
    full_name: string;
    avatar: string | null;
  };
  // Optional simulated fields for UI
  recommended?: boolean;
  price?: string;
  reason?: string;
  distance?: string;
}

export interface Request {
  id: string;
  user_id: string;
  service: string;
  location: string;
  requested_time: string;
  time?: string;
  status: string;
  priority: string;
  raw_input: string;
  reasoning?: string;
  created_at: string;
  preferred_start_time?: string | null;
  preferred_end_time?: string | null;
  is_scheduled?: boolean;
}

export interface Booking {
  id: string;
  request_id: string;
  provider_id: string;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled' | 'pending' | 'assigned' | 'accepted' | 'en_route' | 'arrived' | 'working';
  technician_status?: string;
  scheduled_time: string;
  created_at: string;
  provider_lat?: number;
  provider_lng?: number;
  user_lat?: number;
  user_lng?: number;
  current_lat?: number;
  current_lng?: number;
  route_progress?: number;
  eta_minutes?: number;
  travel_status?: string;
}

export interface Trace {
  id: string;
  request_id: string;
  agent: string;
  action: string;
  created_at: string;
}

export interface Followup {
  id: string;
  booking_id: string;
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
}
