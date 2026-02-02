-- Fix critical timezone bug in add_quiz_points and add_tournament_points
-- Bug: Using ::timestamptz assumes server timezone (UTC) instead of Georgia timezone
-- This causes week/month calculations to be off by 4 hours

-- Fix add_quiz_points
CREATE OR REPLACE FUNCTION public.add_quiz_points(
  p_user_id UUID, 
  p_points_to_add INTEGER, 
  p_is_late BOOLEAN,
  p_quiz_start_at TIMESTAMPTZ,
  p_submitted_at TIMESTAMPTZ
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
  -- Set flag to allow points update
  PERFORM set_config('app.allow_points_update', 'true', true);
  
  -- FIXED: Calculate current calendar week (Mon-Sun) in Georgia timezone
  -- Removed ::timestamptz cast that was causing timezone bugs
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- FIXED: Calculate current calendar month in Georgia timezone
  v_current_month_start := date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  v_current_month_end := (v_current_month_start + interval '1 month');
  
  -- FIXED: Calculate quiz week/month based on START TIME
  v_quiz_week_start := date_trunc('week', (p_quiz_start_at AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  v_quiz_month_start := date_trunc('month', (p_quiz_start_at AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  
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
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    monthly_points = CASE 
      WHEN v_is_in_current_month 
      THEN monthly_points + p_points_to_add 
      ELSE monthly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Clear flag
  PERFORM set_config('app.allow_points_update', 'false', true);
END;
$$;

-- Fix add_tournament_points
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
  -- Set flag to allow points update
  PERFORM set_config('app.allow_points_update', 'true', true);
  
  -- FIXED: Calculate current calendar week (Mon-Sun) in Georgia timezone
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- FIXED: Calculate current calendar month in Georgia timezone
  v_current_month_start := date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  v_current_month_end := (v_current_month_start + interval '1 month');
  
  -- FIXED: Calculate tournament week/month based on START TIME
  v_tournament_week_start := date_trunc('week', (p_tournament_start_at AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  v_tournament_month_start := date_trunc('month', (p_tournament_start_at AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi';
  
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
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    monthly_points = CASE 
      WHEN v_is_in_current_month 
      THEN monthly_points + p_points_to_add 
      ELSE monthly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Clear flag
  PERFORM set_config('app.allow_points_update', 'false', true);
END;
$$;

-- Fix get_weekly_leaderboard
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
      -- FIXED: Use calendar week (Mon-Sun) in Georgia timezone based on QUIZ START TIME
      AND q.start_at >= (
        date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi'
      )
      AND q.start_at < (
        (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days') AT TIME ZONE 'Asia/Tbilisi'
      )
    
    UNION ALL
    
    -- Tournament submissions - join with quizzes to get start_at
    SELECT 
      ts.user_id,
      ts.total_score
    FROM tournament_submissions ts
    INNER JOIN quizzes q ON q.id = ts.quiz_id
    WHERE ts.submitted_at IS NOT NULL
      -- FIXED: Use calendar week (Mon-Sun) in Georgia timezone based on TOURNAMENT START TIME
      AND COALESCE(q.tournament_starts_at, q.start_at) >= (
        date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi'
      )
      AND COALESCE(q.tournament_starts_at, q.start_at) < (
        (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days') AT TIME ZONE 'Asia/Tbilisi'
      )
  ) combined
  GROUP BY user_id
  ORDER BY weekly_points DESC;
$function$;

-- Fix get_monthly_leaderboard
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
      -- FIXED: Use calendar month in Georgia timezone based on QUIZ START TIME
      AND q.start_at >= (
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi'
      )
      AND q.start_at < (
        (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month') AT TIME ZONE 'Asia/Tbilisi'
      )
    
    UNION ALL
    
    -- Tournament submissions - join with quizzes to get start_at
    SELECT 
      ts.user_id,
      ts.total_score
    FROM tournament_submissions ts
    INNER JOIN quizzes q ON q.id = ts.quiz_id
    WHERE ts.submitted_at IS NOT NULL
      -- FIXED: Use calendar month in Georgia timezone based on TOURNAMENT START TIME
      AND COALESCE(q.tournament_starts_at, q.start_at) >= (
        date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) AT TIME ZONE 'Asia/Tbilisi'
      )
      AND COALESCE(q.tournament_starts_at, q.start_at) < (
        (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month') AT TIME ZONE 'Asia/Tbilisi'
      )
  ) combined
  GROUP BY user_id
  ORDER BY monthly_points DESC;
$function$;

COMMENT ON FUNCTION public.add_quiz_points(UUID, INTEGER, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Adds quiz points to user profile. Weekly/monthly points added only if quiz started in current week/month in Georgia timezone. FIXED: Removed timezone cast bug that was causing 4-hour offset.';

COMMENT ON FUNCTION public.add_tournament_points(UUID, INTEGER, TIMESTAMPTZ) IS 
'Adds tournament points to user profile. Weekly/monthly points added only if tournament started in current week/month in Georgia timezone. FIXED: Removed timezone cast bug that was causing 4-hour offset.';

COMMENT ON FUNCTION public.get_weekly_leaderboard() IS 
'Returns weekly leaderboard using calendar week (Mon-Sun) in Georgia timezone, based on QUIZ START TIME. FIXED: Removed timezone cast bug.';

COMMENT ON FUNCTION public.get_monthly_leaderboard() IS 
'Returns monthly leaderboard using calendar month in Georgia timezone, based on QUIZ START TIME. FIXED: Removed timezone cast bug.';
