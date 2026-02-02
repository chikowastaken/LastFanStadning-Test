-- Function to get leaderboard with dynamic monthly points
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
RETURNS TABLE (
  user_id uuid,
  monthly_points bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    qs.user_id,
    COALESCE(SUM(qs.total_score), 0)::bigint as monthly_points
  FROM quiz_submissions qs
  INNER JOIN quizzes q ON q.id = qs.quiz_id
  WHERE q.start_at >= date_trunc('month', now())
    AND q.start_at < date_trunc('month', now()) + interval '1 month'
  GROUP BY qs.user_id
  ORDER BY monthly_points DESC;
$$;

-- Function to get leaderboard with dynamic weekly points (rolling 7 days)
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
RETURNS TABLE (
  user_id uuid,
  weekly_points bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    qs.user_id,
    COALESCE(SUM(qs.total_score), 0)::bigint as weekly_points
  FROM quiz_submissions qs
  INNER JOIN quizzes q ON q.id = qs.quiz_id
  WHERE q.start_at >= (now() - interval '7 days')
  GROUP BY qs.user_id
  ORDER BY weekly_points DESC;
$$;