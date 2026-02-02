-- Restructure tournament_answers to use jsonb answers column
-- First, drop the old structure and recreate with new schema

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert own tournament answers" ON public.tournament_answers;
DROP POLICY IF EXISTS "Users can view own tournament answers" ON public.tournament_answers;

-- Drop the old table and recreate with new structure
DROP TABLE IF EXISTS public.tournament_answers;

CREATE TABLE public.tournament_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tournament_answers ENABLE ROW LEVEL SECURITY;

-- Users can insert their own answers (only if registered for tournament)
CREATE POLICY "tournament_answers_insert_own"
ON public.tournament_answers
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.tournament_registrations r
    WHERE r.quiz_id = tournament_answers.quiz_id
      AND r.user_id = auth.uid()
  )
);

-- Users can update their own answers
CREATE POLICY "tournament_answers_update_own"
ON public.tournament_answers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can only view their own answers (not other users')
CREATE POLICY "tournament_answers_select_own"
ON public.tournament_answers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all answers
CREATE POLICY "tournament_answers_admin_all"
ON public.tournament_answers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tournament_answers_updated_at
  BEFORE UPDATE ON public.tournament_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();