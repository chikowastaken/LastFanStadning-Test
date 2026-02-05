-- Add results_released column to quizzes table for tournaments
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS results_released BOOLEAN NOT NULL DEFAULT false;

-- Drop existing function to recreate with new signature
DROP FUNCTION IF EXISTS public.get_tournament_leaderboard(uuid);

-- Updated leaderboard function: returns submitted_at for millisecond precision ranking
-- Ranking: score DESC, then submitted_at ASC (earlier submission wins tiebreaker)
CREATE OR REPLACE FUNCTION public.get_tournament_leaderboard(
  p_quiz_id uuid,
  p_limit integer DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  total_score integer,
  submitted_at timestamptz,
  rank bigint
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    ts.user_id,
    ts.total_score,
    ts.submitted_at,
    ROW_NUMBER() OVER (ORDER BY ts.total_score DESC, ts.submitted_at ASC) as rank
  FROM tournament_submissions ts
  WHERE ts.quiz_id = p_quiz_id
    AND ts.submitted_at IS NOT NULL
  ORDER BY ts.total_score DESC, ts.submitted_at ASC
  LIMIT p_limit;
$$;

-- New function: get specific user's rank regardless of position
CREATE OR REPLACE FUNCTION public.get_user_tournament_rank(
  p_quiz_id uuid,
  p_user_id uuid
)
RETURNS TABLE(
  user_id uuid,
  total_score integer,
  submitted_at timestamptz,
  rank bigint
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT
      ts.user_id,
      ts.total_score,
      ts.submitted_at,
      ROW_NUMBER() OVER (ORDER BY ts.total_score DESC, ts.submitted_at ASC) as rank
    FROM tournament_submissions ts
    WHERE ts.quiz_id = p_quiz_id
      AND ts.submitted_at IS NOT NULL
  )
  SELECT * FROM ranked WHERE user_id = p_user_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_tournament_rank(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tournament_rank(uuid, uuid) TO anon;
