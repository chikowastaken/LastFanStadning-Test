-- Fix the prevent_points_manipulation trigger to handle cases where monthly_points might not exist
-- This allows username updates to work even if monthly_points column doesn't exist

CREATE OR REPLACE FUNCTION public.prevent_points_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_points_exists BOOLEAN;
BEGIN
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
  
  -- Check if monthly_points column exists before checking it
  -- Query information_schema to see if the column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'monthly_points'
  ) INTO v_monthly_points_exists;
  
  -- Only check monthly_points if the column exists
  IF v_monthly_points_exists THEN
    IF OLD.monthly_points IS DISTINCT FROM NEW.monthly_points THEN
      RAISE EXCEPTION 'Direct modification of monthly_points is not allowed.';
    END IF;
  END IF;
  
  -- Allow other column updates (username, avatar_url, email, etc.)
  RETURN NEW;
END;
$$;
