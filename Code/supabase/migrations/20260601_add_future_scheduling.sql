-- Add future scheduling fields to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS preferred_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preferred_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;
