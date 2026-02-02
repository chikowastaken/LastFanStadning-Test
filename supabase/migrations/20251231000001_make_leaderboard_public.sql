-- Make leaderboard data publicly accessible (no authentication required)
-- This allows unauthenticated users to view rankings

-- 1. Allow anonymous users to read profiles (for leaderboard display)
-- Only expose id, username, and total_points (no sensitive data)
-- Note: This policy allows both anonymous and authenticated users to view profiles
CREATE POLICY "Public can view profiles for leaderboard"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Grant SELECT on profiles table to anonymous users (for leaderboard queries)
GRANT SELECT (id, username, total_points, avatar_url) ON public.profiles TO anon, authenticated;

-- 3. Update leaderboard functions to use SECURITY DEFINER
-- This allows them to access quiz_submissions and tournament_submissions tables
-- even when called by anonymous users, while keeping the underlying data protected
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(user_id uuid, weekly_points bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    user_id,
    COALESCE(SUM(total_score), 0)::bigint as weekly_points
  FROM (
    -- Daily quiz submissions - join with quizzes to get start_at
    SELECT 
      qs.user_id,
      qs.total_score
    FROM quiz_submissions qs
    INNER JOIN quizzes q ON q.id = qs.quiz_id
    WHERE qs.submitted_at IS NOT NULL
      -- Use calendar week (Mon-Sun) in Georgia timezone based on QUIZ START TIME
      AND q.start_at >= (
        date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND q.start_at < (
        (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
    
    UNION ALL
    
    -- Tournament submissions - join with quizzes to get start_at
    SELECT 
      ts.user_id,
      ts.total_score
    FROM tournament_submissions ts
    INNER JOIN quizzes q ON q.id = ts.quiz_id
    WHERE ts.submitted_at IS NOT NULL
      -- Use calendar week (Mon-Sun) in Georgia timezone based on TOURNAMENT START TIME
      AND COALESCE(q.tournament_starts_at, q.start_at) >= (
        date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND COALESCE(q.tournament_starts_at, q.start_at) < (
        (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
  ) combined
  GROUP BY user_id
  ORDER BY weekly_points DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
RETURNS TABLE(user_id uuid, monthly_points bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    user_id,
    COALESCE(SUM(total_score), 0)::bigint as monthly_points
  FROM (
    -- Daily quiz submissions - join with quizzes to get start_at
    SELECT 
      qs.user_id,
      qs.total_score
    FROM quiz_submissions qs
    INNER JOIN quizzes q ON q.id = qs.quiz_id
    WHERE qs.submitted_at IS NOT NULL
      -- Use calendar month in Georgia timezone based on QUIZ START TIME
      AND q.start_at >= (
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND q.start_at < (
        (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
    
    UNION ALL
    
    -- Tournament submissions - join with quizzes to get start_at
    SELECT 
      ts.user_id,
      ts.total_score
    FROM tournament_submissions ts
    INNER JOIN quizzes q ON q.id = ts.quiz_id
    WHERE ts.submitted_at IS NOT NULL
      -- Use calendar month in Georgia timezone based on TOURNAMENT START TIME
      AND COALESCE(q.tournament_starts_at, q.start_at) >= (
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND COALESCE(q.tournament_starts_at, q.start_at) < (
        (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
  ) combined
  GROUP BY user_id
  ORDER BY monthly_points DESC;
$function$;

-- 4. Grant execute permissions on leaderboard functions to anonymous users
GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_leaderboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tournament_leaderboard(uuid) TO anon, authenticated;

