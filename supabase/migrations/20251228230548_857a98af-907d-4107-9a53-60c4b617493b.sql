-- Update weekly leaderboard to use calendar week (Mon-Sun) in Georgia time (UTC+4)
CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
 RETURNS TABLE(user_id uuid, weekly_points bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    qs.user_id,
    COALESCE(SUM(qs.total_score), 0)::bigint as weekly_points
  FROM quiz_submissions qs
  INNER JOIN quizzes q ON q.id = qs.quiz_id
  WHERE q.start_at >= date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
    AND q.start_at < (date_trunc('week', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '7 days')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
  GROUP BY qs.user_id
  ORDER BY weekly_points DESC;
$function$;

-- Update monthly leaderboard to use Georgia timezone
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
 RETURNS TABLE(user_id uuid, monthly_points bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    qs.user_id,
    COALESCE(SUM(qs.total_score), 0)::bigint as monthly_points
  FROM quiz_submissions qs
  INNER JOIN quizzes q ON q.id = qs.quiz_id
  WHERE q.start_at >= date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi'))::timestamptz AT TIME ZONE 'Asia/Tbilisi'
    AND q.start_at < (date_trunc('month', (now() AT TIME ZONE 'Asia/Tbilisi')) + interval '1 month')::timestamptz AT TIME ZONE 'Asia/Tbilisi'
  GROUP BY qs.user_id
  ORDER BY monthly_points DESC;
$function$;