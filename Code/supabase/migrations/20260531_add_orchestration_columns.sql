-- Add missing columns to orchestration_sessions table

ALTER TABLE public.orchestration_sessions 
ADD COLUMN IF NOT EXISTS completed_stages JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orchestration_sessions 
ADD COLUMN IF NOT EXISTS candidate_providers JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orchestration_sessions 
ADD COLUMN IF NOT EXISTS ranking_result JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orchestration_sessions 
ADD COLUMN IF NOT EXISTS trace_ids JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orchestration_sessions 
ADD COLUMN IF NOT EXISTS assigned_provider UUID;

ALTER TABLE public.orchestration_sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
