-- Add is_late column to quiz_submissions to track live vs late submissions
ALTER TABLE public.quiz_submissions 
ADD COLUMN is_late BOOLEAN NOT NULL DEFAULT false;

-- Add weekly_points to profiles for weekly leaderboard tracking
ALTER TABLE public.profiles 
ADD COLUMN weekly_points INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.quiz_submissions.is_late IS 'True if submitted after quiz end_at, receives reduced points';
COMMENT ON COLUMN public.profiles.weekly_points IS 'Points accumulated in the current week for weekly leaderboard';

-- Create function to add points with live/late distinction
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
  v_is_within_week BOOLEAN;
BEGIN
  -- Check if quiz started within the last 7 days (for weekly leaderboard)
  v_is_within_week := p_quiz_start_at >= (now() - INTERVAL '7 days');
  
  -- Always add to global total_points
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points_to_add,
    -- Add to weekly_points only if:
    -- 1. Live submission (always counts for weekly), OR
    -- 2. Late submission but quiz is within last 7 days
    weekly_points = CASE 
      WHEN NOT p_is_late OR v_is_within_week 
      THEN weekly_points + p_points_to_add 
      ELSE weekly_points 
    END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Function to reset weekly points (to be called by a scheduled job or manually)
CREATE OR REPLACE FUNCTION public.reset_weekly_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET weekly_points = 0, updated_at = now();
END;
$$;