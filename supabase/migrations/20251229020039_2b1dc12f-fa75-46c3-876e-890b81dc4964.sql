-- Add quiz_type enum-like column with check constraint
ALTER TABLE public.quizzes 
ADD COLUMN quiz_type text NOT NULL DEFAULT 'daily' CHECK (quiz_type IN ('daily', 'tournament'));

-- Add tournament-specific columns
ALTER TABLE public.quizzes
ADD COLUMN tournament_prize_gel integer,
ADD COLUMN registration_opens_at timestamp with time zone,
ADD COLUMN registration_closes_at timestamp with time zone,
ADD COLUMN tournament_starts_at timestamp with time zone,
ADD COLUMN tournament_ends_at timestamp with time zone;

-- Create tournament_registrations table
CREATE TABLE public.tournament_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
ON public.tournament_registrations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can register for tournaments (with time window check)
CREATE POLICY "Users can register for tournaments"
ON public.tournament_registrations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id
      AND q.quiz_type = 'tournament'
      AND now() >= q.registration_opens_at
      AND now() < q.registration_closes_at
  )
);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.tournament_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage registrations
CREATE POLICY "Admins can manage registrations"
ON public.tournament_registrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));