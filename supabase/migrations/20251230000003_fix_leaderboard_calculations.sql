-- Fix leaderboard calculation mismatch
-- Issues:
-- 1. get_weekly_leaderboard uses calendar week but filters by q.start_at instead of qs.submitted_at
-- 2. add_quiz_points uses rolling 7-day window instead of calendar week
-- 3. Both should use calendar week (Mon-Sun) based on submission time, not quiz start time

-- Fix 1: Update get_weekly_leaderboard to use submitted_at and calendar week
-- Include both quiz_submissions and tournament_submissions
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE(user_id uuid, weekly_points bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    user_id,
    COALESCE(SUM(total_score), 0)::bigint as weekly_points
  FROM (
    -- Daily quiz submissions
    SELECT 
      qs.user_id,
      qs.total_score
    FROM quiz_submissions qs
    WHERE qs.submitted_at IS NOT NULL
      -- Use calendar week (Mon-Sun) in Georgia timezone based on submission time
      AND qs.submitted_at >= (
        date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND qs.submitted_at < (
        (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
    
    UNION ALL
    
    -- Tournament submissions
    SELECT 
      ts.user_id,
      ts.total_score
    FROM tournament_submissions ts
    WHERE ts.submitted_at IS NOT NULL
      -- Use calendar week (Mon-Sun) in Georgia timezone based on submission time
      AND ts.submitted_at >= (
        date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND ts.submitted_at < (
        (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
  ) combined
  GROUP BY user_id
  ORDER BY weekly_points DESC;
$function$;

-- Fix 2: Update get_monthly_leaderboard to use submitted_at
-- Include both quiz_submissions and tournament_submissions
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
RETURNS TABLE(user_id uuid, monthly_points bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    user_id,
    COALESCE(SUM(total_score), 0)::bigint as monthly_points
  FROM (
    -- Daily quiz submissions
    SELECT 
      qs.user_id,
      qs.total_score
    FROM quiz_submissions qs
    WHERE qs.submitted_at IS NOT NULL
      -- Use calendar month in Georgia timezone based on submission time
      AND qs.submitted_at >= (
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND qs.submitted_at < (
        (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
    
    UNION ALL
    
    -- Tournament submissions
    SELECT 
      ts.user_id,
      ts.total_score
    FROM tournament_submissions ts
    WHERE ts.submitted_at IS NOT NULL
      -- Use calendar month in Georgia timezone based on submission time
      AND ts.submitted_at >= (
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
      AND ts.submitted_at < (
        (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
      )
  ) combined
  GROUP BY user_id
  ORDER BY monthly_points DESC;
$function$;

-- Fix 3: Update add_quiz_points to use calendar week logic instead of rolling 7 days
-- This ensures consistency with get_weekly_leaderboard
CREATE OR REPLACE FUNCTION public.add_quiz_points(
  p_user_id UUID, 
  p_points_to_add INTEGER, 
  p_is_late BOOLEAN,
  p_quiz_start_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_week_start TIMESTAMPTZ;
  v_current_week_end TIMESTAMPTZ;
  v_submission_week_start TIMESTAMPTZ;
  v_submission_week_end TIMESTAMPTZ;
  v_is_in_current_week BOOLEAN;
BEGIN
  -- Calculate current calendar week (Mon-Sun) in Georgia timezone
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- Calculate submission week based on quiz start time (for late submissions, we use quiz start time)
  -- Note: We use p_quiz_start_at because late submissions should count in the week the quiz started
  v_submission_week_start := date_trunc('week', (p_quiz_start_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_submission_week_end := (v_submission_week_start + interval '7 days');
  
  -- Check if submission week overlaps with current week
  -- Submission counts if it's in the current calendar week
  v_is_in_current_week := (
    v_submission_week_start >= v_current_week_start AND v_submission_week_start < v_current_week_end
  ) OR (
    v_current_week_start >= v_submission_week_start AND v_current_week_start < v_submission_week_end
  );
  
  -- Always add to global total_points
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points_to_add,
    -- Add to weekly_points only if submission is in current calendar week
    -- This matches the logic in get_weekly_leaderboard
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_weekly_leaderboard IS 
'Returns weekly leaderboard using calendar week (Mon-Sun) in Georgia timezone, based on submission time. Includes both daily quizzes and tournaments';

COMMENT ON FUNCTION public.get_monthly_leaderboard IS 
'Returns monthly leaderboard using calendar month in Georgia timezone, based on submission time. Includes both daily quizzes and tournaments';

COMMENT ON FUNCTION public.add_quiz_points IS 
'Adds points to user profile. Weekly points are added only if submission falls in current calendar week (Mon-Sun), matching get_weekly_leaderboard logic';

