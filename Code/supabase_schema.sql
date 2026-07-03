-- Schema for AetherFlow

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'resident',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROVIDERS (Technicians)
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  availability TEXT DEFAULT 'available',
  location TEXT,
  service_area TEXT,
  working_hours_start TEXT,
  working_hours_end TEXT,
  specialization TEXT,
  experience_years INT,
  service_radius_km INT,
  city TEXT,
  verification_status TEXT DEFAULT 'pending',
  completed_jobs INT DEFAULT 0
);

-- REQUESTS
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  location TEXT,
  time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  raw_input TEXT,
  requested_time TEXT,
  priority TEXT,
  reasoning TEXT
);

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  provider_lat NUMERIC,
  provider_lng NUMERIC,
  user_lat NUMERIC,
  user_lng NUMERIC,
  eta_minutes INT,
  travel_status TEXT
);

-- TRACES
CREATE TABLE public.traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FOLLOWUPS
CREATE TABLE public.followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);

-- Setup RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- Allow public access for Hackathon purposes, but limit to authenticated users ideally.
-- You can run these commands if you want quick access.
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- For simplicity in the hackathon, we can create liberal policies for other tables
CREATE POLICY "Enable all actions for authenticated users" ON providers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON bookings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON traces FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON followups FOR ALL USING (auth.role() = 'authenticated');
