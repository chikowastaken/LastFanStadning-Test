-- Fix search_path security warning for check_quiz_locked function
CREATE OR REPLACE FUNCTION public.check_quiz_locked(quiz_start_at TIMESTAMPTZ, quiz_end_at TIMESTAMPTZ)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT now() > quiz_end_at;
$$;