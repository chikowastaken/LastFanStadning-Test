-- Create tournament_submissions table (separate from quiz_submissions)
CREATE TABLE public.tournament_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  duration_seconds integer,
  total_score integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id) -- Enforce one attempt per user per tournament
);

-- Create tournament_answers table
CREATE TABLE public.tournament_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.tournament_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  points_earned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_answers ENABLE ROW LEVEL SECURITY;

-- Tournament submissions policies
CREATE POLICY "Users can view own tournament submissions"
ON public.tournament_submissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tournament submission"
ON public.tournament_submissions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_id
      AND q.quiz_type = 'tournament'
  )
  AND EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    WHERE tr.quiz_id = tournament_submissions.quiz_id
      AND tr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own tournament submission"
ON public.tournament_submissions
FOR UPDATE
USING (auth.uid() = user_id AND submitted_at IS NULL);

CREATE POLICY "Admins can view all tournament submissions"
ON public.tournament_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tournament answers policies
CREATE POLICY "Users can view own tournament answers"
ON public.tournament_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tournament_submissions ts
    WHERE ts.id = submission_id AND ts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own tournament answers"
ON public.tournament_answers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournament_submissions ts
    WHERE ts.id = submission_id 
      AND ts.user_id = auth.uid()
      AND ts.submitted_at IS NULL
  )
);

-- Function to get tournament leaderboard
CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(p_quiz_id uuid)
RETURNS TABLE(user_id uuid, total_score integer, duration_seconds integer, rank bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    ts.user_id,
    ts.total_score,
    ts.duration_seconds,
    ROW_NUMBER() OVER (ORDER BY ts.total_score DESC, ts.duration_seconds ASC) as rank
  FROM tournament_submissions ts
  WHERE ts.quiz_id = p_quiz_id
    AND ts.submitted_at IS NOT NULL
  ORDER BY ts.total_score DESC, ts.duration_seconds ASC;
$$;