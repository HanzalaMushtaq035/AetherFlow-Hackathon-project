-- Alter bookings table to support future dispatch fields
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_future_booking BOOLEAN DEFAULT false;

-- Ensure status default is pending (for consistency)
ALTER TABLE public.bookings
ALTER COLUMN status SET DEFAULT 'pending';
