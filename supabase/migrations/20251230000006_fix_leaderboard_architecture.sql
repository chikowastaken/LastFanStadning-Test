-- Fix leaderboard architecture
-- Requirements:
-- 1. Add monthly_points column to profiles
-- 2. Weekly/monthly points based on QUIZ START TIME (start_at), not submission time
-- 3. Reset weekly_points every Monday, monthly_points on 1st of month
-- 4. If quiz started 2 weeks ago but submitted today, count toward monthly/total but NOT weekly

-- Step 1: Add monthly_points column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_points INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.monthly_points IS 'Points accumulated in the current month for monthly leaderboard';

-- Step 2: Update add_quiz_points to use QUIZ START TIME for weekly/monthly
-- This ensures late submissions count in the week/month the quiz started
CREATE OR REPLACE FUNCTION public.add_quiz_points(
  p_user_id UUID, 
  p_points_to_add INTEGER, 
  p_is_late BOOLEAN,
  p_quiz_start_at TIMESTAMPTZ,
  p_submitted_at TIMESTAMPTZ -- Keep for reference but use start_at for calculations
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_week_start TIMESTAMPTZ;
  v_current_week_end TIMESTAMPTZ;
  v_current_month_start TIMESTAMPTZ;
  v_current_month_end TIMESTAMPTZ;
  v_quiz_week_start TIMESTAMPTZ;
  v_quiz_month_start TIMESTAMPTZ;
  v_is_in_current_week BOOLEAN;
  v_is_in_current_month BOOLEAN;
BEGIN
  -- Calculate current calendar week (Mon-Sun) in Georgia timezone
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- Calculate current calendar month in Georgia timezone
  v_current_month_start := date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_month_end := (v_current_month_start + interval '1 month');
  
  -- Calculate quiz week/month based on QUIZ START TIME (not submission time)
  -- This ensures late submissions count in the period when quiz started
  v_quiz_week_start := date_trunc('week', (p_quiz_start_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_quiz_month_start := date_trunc('month', (p_quiz_start_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  
  -- Check if quiz started in current week
  v_is_in_current_week := (
    v_quiz_week_start >= v_current_week_start AND v_quiz_week_start < v_current_week_end
  );
  
  -- Check if quiz started in current month
  v_is_in_current_month := (
    v_quiz_month_start >= v_current_month_start AND v_quiz_month_start < v_current_month_end
  );
  
  -- Always add to global total_points
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points_to_add,
    -- Add to weekly_points only if quiz STARTED in current calendar week
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    -- Add to monthly_points only if quiz STARTED in current calendar month
    monthly_points = CASE 
      WHEN v_is_in_current_month 
      THEN monthly_points + p_points_to_add 
      ELSE monthly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Add comment with full function signature to avoid ambiguity
COMMENT ON FUNCTION public.add_quiz_points(UUID, INTEGER, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Adds points to user profile. Weekly/monthly points are added only if quiz STARTED in current calendar week/month (based on start_at, not submitted_at). This ensures late submissions count in the period when quiz started.';

-- Step 3: Update add_tournament_points to use tournament START TIME
CREATE OR REPLACE FUNCTION public.add_tournament_points(
  p_user_id UUID,
  p_points_to_add INTEGER,
  p_tournament_start_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_week_start TIMESTAMPTZ;
  v_current_week_end TIMESTAMPTZ;
  v_current_month_start TIMESTAMPTZ;
  v_current_month_end TIMESTAMPTZ;
  v_tournament_week_start TIMESTAMPTZ;
  v_tournament_month_start TIMESTAMPTZ;
  v_is_in_current_week BOOLEAN;
  v_is_in_current_month BOOLEAN;
BEGIN
  -- Calculate current calendar week (Mon-Sun) in Georgia timezone
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- Calculate current calendar month in Georgia timezone
  v_current_month_start := date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_month_end := (v_current_month_start + interval '1 month');
  
  -- Calculate tournament week/month based on START TIME
  v_tournament_week_start := date_trunc('week', (p_tournament_start_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_tournament_month_start := date_trunc('month', (p_tournament_start_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  
  -- Check if tournament started in current week
  v_is_in_current_week := (
    v_tournament_week_start >= v_current_week_start AND v_tournament_week_start < v_current_week_end
  );
  
  -- Check if tournament started in current month
  v_is_in_current_month := (
    v_tournament_month_start >= v_current_month_start AND v_tournament_month_start < v_current_month_end
  );
  
  -- Update user points
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points_to_add,
    -- Add to weekly_points only if tournament STARTED in current calendar week
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    -- Add to monthly_points only if tournament STARTED in current calendar month
    monthly_points = CASE 
      WHEN v_is_in_current_month 
      THEN monthly_points + p_points_to_add 
      ELSE monthly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Step 4: Update leaderboard functions to use QUIZ START TIME (not submission time)
-- This matches the logic in add_quiz_points
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

-- Step 5: Create reset functions for weekly (Monday) and monthly (1st of month)
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset weekly_points for all users
  -- Should be called every Monday at 00:00:00 (Asia/Tbilisi timezone)
  UPDATE public.profiles 
  SET weekly_points = 0, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_monthly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset monthly_points for all users
  -- Should be called on the 1st of each month at 00:00:00 (Asia/Tbilisi timezone)
  UPDATE public.profiles 
  SET monthly_points = 0, updated_at = now();
END;
$$;

-- Add comments with full function signatures
COMMENT ON FUNCTION public.get_weekly_leaderboard() IS 
'Returns weekly leaderboard using calendar week (Mon-Sun) in Georgia timezone, based on QUIZ START TIME (start_at). Includes both daily quizzes and tournaments.';

COMMENT ON FUNCTION public.get_monthly_leaderboard() IS 
'Returns monthly leaderboard using calendar month in Georgia timezone, based on QUIZ START TIME (start_at). Includes both daily quizzes and tournaments.';

COMMENT ON FUNCTION public.reset_weekly_points() IS 
'Resets weekly_points for all users. Should be called every Monday at 00:00:00 (Asia/Tbilisi timezone).';

COMMENT ON FUNCTION public.reset_monthly_points() IS 
'Resets monthly_points for all users. Should be called on the 1st of each month at 00:00:00 (Asia/Tbilisi timezone).';