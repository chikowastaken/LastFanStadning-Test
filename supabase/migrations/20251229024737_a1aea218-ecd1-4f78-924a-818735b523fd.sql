-- Update check_end_at_24h constraint to only apply 24h rule to daily quizzes
ALTER TABLE public.quizzes
  DROP CONSTRAINT IF EXISTS check_end_at_24h;

ALTER TABLE public.quizzes
  ADD CONSTRAINT check_end_at_24h
  CHECK (
    (
      COALESCE(quiz_type, 'daily') = 'daily'
      AND end_at = start_at + interval '24 hours'
    )
    OR
    (
      COALESCE(quiz_type, 'daily') <> 'daily'
      AND end_at > start_at
    )
  );