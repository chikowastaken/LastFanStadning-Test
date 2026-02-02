-- Ensure RLS is enabled
ALTER TABLE public.tournament_submissions ENABLE ROW LEVEL SECURITY;

-- Remove any old policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "tournament_submissions_insert_own" ON public.tournament_submissions;
DROP POLICY IF EXISTS "tournament_submissions_update_own" ON public.tournament_submissions;
DROP POLICY IF EXISTS "tournament_submissions_select_all_auth" ON public.tournament_submissions;
DROP POLICY IF EXISTS "Users can insert own tournament submission" ON public.tournament_submissions;
DROP POLICY IF EXISTS "Users can update own tournament submission" ON public.tournament_submissions;
DROP POLICY IF EXISTS "Users can view own tournament submissions" ON public.tournament_submissions;

-- INSERT: user can insert only their own row AND only if registered for that tournament
CREATE POLICY "tournament_submissions_insert_own"
ON public.tournament_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.tournament_registrations r
    WHERE r.quiz_id = tournament_submissions.quiz_id
      AND r.user_id = auth.uid()
  )
);

-- UPDATE: user can update only their own row (used when submitting / updating score)
CREATE POLICY "tournament_submissions_update_own"
ON public.tournament_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SELECT: allow authenticated users to read all submissions (needed for leaderboard)
CREATE POLICY "tournament_submissions_select_all_auth"
ON public.tournament_submissions
FOR SELECT
TO authenticated
USING (true);