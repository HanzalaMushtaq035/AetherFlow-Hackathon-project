-- Create provider_availability table
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'busy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and public/authenticated policies for provider_availability
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all actions for authenticated users" ON public.provider_availability FOR ALL USING (auth.role() = 'authenticated');

-- Extend providers table with new columns if they do not exist
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS daily_capacity INT DEFAULT 5;

ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS max_parallel_jobs INT DEFAULT 1;
