
-- ORCHESTRATION_SESSIONS
CREATE TABLE IF NOT EXISTS public.orchestration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  current_stage TEXT DEFAULT 'INTENT',
  selected_provider UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  assigned_provider UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ranking_score NUMERIC,
  timeline JSONB,
  status TEXT DEFAULT 'ORCHESTRATING',
  completed_stages JSONB DEFAULT '[]'::jsonb,
  candidate_providers JSONB DEFAULT '[]'::jsonb,
  ranking_result JSONB DEFAULT '[]'::jsonb,
  trace_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.orchestration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all actions for authenticated users" ON orchestration_sessions FOR ALL USING (auth.role() = 'authenticated');
