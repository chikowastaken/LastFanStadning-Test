-- CRITICAL SECURITY FIX: Prevent users from modifying points columns directly
-- The RLS policy allows users to UPDATE their own profile, which could allow point manipulation
-- This trigger prevents direct modification of points columns

-- Create function to prevent point manipulation
CREATE OR REPLACE FUNCTION public.prevent_points_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if points columns are being modified
  -- If so, check if the update is coming from a SECURITY DEFINER function
  -- SECURITY DEFINER functions run with elevated privileges and can set session variables
  
  -- Check if this is an authorized update (from RPC function)
  -- RPC functions set a session variable before updating
  IF current_setting('app.allow_points_update', true) = 'true' THEN
    -- Allowed - called from authorized RPC function
    RETURN NEW;
  END IF;
  
  -- Block direct modification of points columns
  IF OLD.total_points IS DISTINCT FROM NEW.total_points THEN
    RAISE EXCEPTION 'Direct modification of total_points is not allowed. Points can only be updated through quiz/tournament submissions.';
  END IF;
  
  IF OLD.weekly_points IS DISTINCT FROM NEW.weekly_points THEN
    RAISE EXCEPTION 'Direct modification of weekly_points is not allowed.';
  END IF;
  
  IF OLD.monthly_points IS DISTINCT FROM NEW.monthly_points THEN
    RAISE EXCEPTION 'Direct modification of monthly_points is not allowed.';
  END IF;
  
  -- Allow other column updates (username, avatar_url, email, etc.)
  RETURN NEW;
END;
$$;

-- Create trigger to enforce point protection
DROP TRIGGER IF EXISTS prevent_points_manipulation_trigger ON public.profiles;
CREATE TRIGGER prevent_points_manipulation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_points_manipulation();

-- Update add_quiz_points to set the flag before updating
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
  
  -- Calculate current calendar week (Mon-Sun) in Georgia timezone
  v_current_week_start := date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_week_end := (v_current_week_start + interval '7 days');
  
  -- Calculate current calendar month in Georgia timezone
  v_current_month_start := date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi';
  v_current_month_end := (v_current_month_start + interval '1 month');
  
  -- Calculate quiz week/month based on QUIZ START TIME (not submission time)
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

-- Update add_tournament_points to set the flag
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

-- Update reset functions to set the flag
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set flag to allow points update
  PERFORM set_config('app.allow_points_update', 'true', true);
  
  -- Reset weekly_points for all users
  UPDATE public.profiles 
  SET weekly_points = 0, updated_at = now();
  
  -- Clear flag
  PERFORM set_config('app.allow_points_update', 'false', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_monthly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set flag to allow points update
  PERFORM set_config('app.allow_points_update', 'true', true);
  
  -- Reset monthly_points for all users
  UPDATE public.profiles 
  SET monthly_points = 0, updated_at = now();
  
  -- Clear flag
  PERFORM set_config('app.allow_points_update', 'false', true);
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.prevent_points_manipulation() IS 
'Security trigger that prevents users from directly modifying points columns. Points can only be updated through authorized RPC functions.';

COMMENT ON TRIGGER prevent_points_manipulation_trigger ON public.profiles IS 
'Prevents direct manipulation of total_points, weekly_points, and monthly_points columns by users.';

