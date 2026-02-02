drop extension if exists "pg_net";

drop function if exists "public"."add_quiz_points"(p_user_id uuid, p_points_to_add integer, p_is_late boolean, p_quiz_start_at timestamp with time zone, p_submitted_at timestamp with time zone);

drop function if exists "public"."add_tournament_points"(p_user_id uuid, p_points_to_add integer, p_tournament_start_at timestamp with time zone);

drop function if exists "public"."reset_monthly_points"();

drop function if exists "public"."submit_quiz_atomic"(p_submission_id uuid, p_user_id uuid, p_quiz_id uuid, p_submitted_at timestamp with time zone, p_total_score integer, p_is_late boolean, p_duration_seconds integer, p_quiz_start_at timestamp with time zone, p_answers jsonb);

alter table "public"."profiles" drop column "monthly_points";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_quiz_points(p_user_id uuid, p_points_to_add integer, p_is_late boolean, p_quiz_start_at timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _full_name text;
  _first_name text;
  _last_name text;
BEGIN
  -- Get full name from Google data
  _full_name := COALESCE(
    new.raw_user_meta_data ->> 'full_name', 
    new.raw_user_meta_data ->> 'name'
  );
  
  -- Try to get first/last name from Google, or parse from full_name
  _first_name := COALESCE(
    new.raw_user_meta_data ->> 'given_name',
    split_part(_full_name, ' ', 1)
  );
  
  _last_name := COALESCE(
    new.raw_user_meta_data ->> 'family_name',
    CASE 
      WHEN array_length(string_to_array(_full_name, ' '), 1) > 1 
      THEN split_part(_full_name, ' ', 2)
      ELSE NULL
    END
  );

  INSERT INTO public.profiles (
    id,
    username,
    email,
    first_name,
    last_name,
    full_name,
    avatar_url
  )
  VALUES (
    new.id,
    COALESCE(_full_name, split_part(new.email, '@', 1)),
    new.email,
    _first_name,
    _last_name,
    _full_name,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_weekly_points()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles SET weekly_points = 0, updated_at = now();
END;
$function$
;


