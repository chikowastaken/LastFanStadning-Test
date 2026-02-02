-- Fix weekly points logic inconsistency
-- Issue: add_quiz_points uses p_quiz_start_at to determine week, but leaderboard uses submitted_at
-- This causes mismatch for late submissions
-- Fix: Update add_quiz_points to use submitted_at for week calculation (matching leaderboard)

CREATE OR REPLACE FUNCTION public.add_quiz_points(
  p_user_id UUID, 
  p_points_to_add INTEGER, 
  p_is_late BOOLEAN,
  p_quiz_start_at TIMESTAMPTZ,
  p_submitted_at TIMESTAMPTZ -- NEW: Use submission time for week calculation
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
  
  -- Calculate submission week based on SUBMISSION TIME (not quiz start time)
  -- This matches the logic in get_weekly_leaderboard which uses submitted_at
  v_submission_week_start := date_trunc('week', (p_submitted_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
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
    -- This now matches the logic in get_weekly_leaderboard (both use submitted_at)
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

