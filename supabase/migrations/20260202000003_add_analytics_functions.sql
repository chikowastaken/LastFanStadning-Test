-- Helper functions for analytics dashboard
-- These are read-only and won't burden the database

-- Function to count active users (users who have submitted at least one quiz or tournament)
CREATE OR REPLACE FUNCTION public.get_active_users_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT user_id)::integer
  FROM (
    SELECT user_id FROM quiz_submissions WHERE submitted_at IS NOT NULL
    UNION
    SELECT user_id FROM tournament_submissions WHERE submitted_at IS NOT NULL
  ) AS active;
$$;

COMMENT ON FUNCTION public.get_active_users_count() IS 
'Returns count of unique users who have submitted at least one quiz or tournament. Used by analytics dashboard.';

-- Grant execute to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION public.get_active_users_count() TO authenticated;
