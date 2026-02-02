-- Make submitted_at nullable
ALTER TABLE public.quiz_submissions ALTER COLUMN submitted_at DROP DEFAULT;
