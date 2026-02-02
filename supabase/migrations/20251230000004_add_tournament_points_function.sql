-- Add function to update points for tournament submissions
-- Tournaments should also update user points, but they don't use the late submission logic
-- Tournament points are always full value (10 points per question)

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
  v_submission_week_start TIMESTAMPTZ;
  v_submission_week_end TIMESTAMPTZ;
  v_is_in_current_week BOOLEAN;
BEGIN
  -- Calculate current calendar week (Mon-Sun) in Georgia timezone
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- Calculate tournament week based on start time
  v_submission_week_start := date_trunc('week', (p_tournament_start_at AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_submission_week_end := (v_submission_week_start + interval '7 days');
  
  -- Check if tournament week overlaps with current week
  v_is_in_current_week := (
    v_submission_week_start >= v_current_week_start AND v_submission_week_start < v_current_week_end
  ) OR (
    v_current_week_start >= v_submission_week_start AND v_current_week_start < v_submission_week_end
  );
  
  -- Update user points
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points_to_add,
    -- Add to weekly_points only if tournament is in current calendar week
    weekly_points = CASE 
      WHEN v_is_in_current_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.add_tournament_points IS 
'Adds tournament points to user profile. Tournament points are always full value and count toward weekly/monthly leaderboards if tournament is in current period';

