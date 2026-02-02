-- Rename week_number to day_number
ALTER TABLE public.quizzes RENAME COLUMN week_number TO day_number;

-- Add start_at and end_at columns
ALTER TABLE public.quizzes 
ADD COLUMN start_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing data: set start_at based on day_number (starting from a base date)
-- Each day_number represents a calendar day, so we set start_at accordingly
-- Using a base date of 2025-01-01 as day 1
UPDATE public.quizzes
SET 
  start_at = '2025-01-01 00:00:00+00'::timestamptz + ((day_number - 1) * INTERVAL '1 day'),
  end_at = '2025-01-01 00:00:00+00'::timestamptz + ((day_number - 1) * INTERVAL '1 day') + INTERVAL '24 hours';

-- Make start_at and end_at NOT NULL after migration
ALTER TABLE public.quizzes 
ALTER COLUMN start_at SET NOT NULL,
ALTER COLUMN end_at SET NOT NULL;

-- Add a check constraint to ensure end_at is exactly 24 hours after start_at
ALTER TABLE public.quizzes 
ADD CONSTRAINT check_end_at_24h CHECK (end_at = start_at + INTERVAL '24 hours');

-- Create a function to auto-lock quizzes after end_at
CREATE OR REPLACE FUNCTION public.check_quiz_locked(quiz_start_at TIMESTAMPTZ, quiz_end_at TIMESTAMPTZ)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT now() > quiz_end_at;
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.quizzes.day_number IS 'Calendar day index starting from day 1';
COMMENT ON COLUMN public.quizzes.start_at IS 'When the quiz becomes live';
COMMENT ON COLUMN public.quizzes.end_at IS 'Exactly 24 hours after start_at, quiz locks after this';