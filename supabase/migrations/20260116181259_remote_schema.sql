alter table "public"."profiles" add column "monthly_points" integer not null default 0;

alter table "public"."quiz_submissions" alter column "submitted_at" drop default;

alter table "public"."quiz_submissions" alter column "submitted_at" drop not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.submit_quiz_atomic(p_submission_id uuid, p_user_id uuid, p_quiz_id uuid, p_submitted_at timestamp with time zone, p_total_score integer, p_is_late boolean, p_duration_seconds integer, p_quiz_start_at timestamp with time zone, p_answers jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_submission RECORD;
  v_result JSONB;
BEGIN
  -- Start transaction (implicit in function)
  
  -- 1. ATOMIC UPDATE: Update submission ONLY if not already submitted
  -- This prevents race conditions
  UPDATE quiz_submissions
  SET 
    submitted_at = p_submitted_at,
    total_score = p_total_score,
    is_late = p_is_late,
    duration_seconds = p_duration_seconds
  WHERE id = p_submission_id
    AND user_id = p_user_id
    AND quiz_id = p_quiz_id
    AND submitted_at IS NULL -- CRITICAL: Atomic check prevents race condition
  RETURNING * INTO v_updated_submission;

  -- Check if update succeeded (if no rows updated, submission was already submitted)
  IF NOT FOUND THEN
    -- Check if it was already submitted
    IF EXISTS (
      SELECT 1 FROM quiz_submissions 
      WHERE id = p_submission_id AND submitted_at IS NOT NULL
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'ALREADY_SUBMITTED',
        'message', 'Quiz already submitted'
      );
    END IF;
    
    -- Otherwise it's an error
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UPDATE_FAILED',
      'message', 'Failed to update submission'
    );
  END IF;

  -- 2. Insert user answers
  INSERT INTO user_answers (
    submission_id,
    question_id,
    answer,
    is_correct,
    points_earned
  )
  SELECT 
    p_submission_id,
    (value->>'question_id')::UUID,
    value->>'answer',
    (value->>'is_correct')::BOOLEAN,
    (value->>'points_earned')::INTEGER
  FROM jsonb_array_elements(p_answers) AS value;

  -- 3. Update user points (this is also atomic within the transaction)
  -- Pass both start_at and submitted_at - function uses start_at for weekly/monthly calculations
  PERFORM add_quiz_points(
    p_user_id,
    p_total_score,
    p_is_late,
    p_quiz_start_at,
    p_submitted_at -- Passed for reference, but start_at is used for weekly/monthly
  );

  -- Return success with submission data
  RETURN jsonb_build_object(
    'success', true,
    'submission', to_jsonb(v_updated_submission)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically on exception
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TRANSACTION_FAILED',
      'message', SQLERRM
    );
END;
$function$
;


  create policy "Public avatar access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 2) ~~ ((auth.uid())::text || '-%'::text))));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 2) ~~ ((auth.uid())::text || '-%'::text))))
with check (((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 2) ~~ ((auth.uid())::text || '-%'::text))));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND (split_part(name, '/'::text, 2) ~~ ((auth.uid())::text || '-%'::text))));



