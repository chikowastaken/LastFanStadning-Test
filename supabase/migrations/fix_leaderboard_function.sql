-- Fix: Recreate the tournament leaderboard functions
-- Run this in your Supabase SQL Editor

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.get_tournament_leaderboard(uuid);
DROP FUNCTION IF EXISTS public.get_tournament_leaderboard(uuid, integer);

-- Create the leaderboard function with correct signature
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

-- Create the user rank function
DROP FUNCTION IF EXISTS public.get_user_tournament_rank(uuid, uuid);

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_tournament_rank(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tournament_rank(uuid, uuid) TO anon;

-- Test the function
SELECT * FROM get_tournament_leaderboard('6f1b9535-e650-4991-9d24-9d62079c1a0c', 50);
SELECT * FROM get_user_tournament_rank('6f1b9535-e650-4991-9d24-9d62079c1a0c', '46f172b3-8901-4283-848c-273a6232c0e4');
