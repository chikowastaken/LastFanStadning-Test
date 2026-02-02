SET check_function_bodies = off;

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
  UPDATE quiz_submissions
  SET 
    submitted_at = p_submitted_at,
    total_score = p_total_score,
    is_late = p_is_late,
    duration_seconds = p_duration_seconds
  WHERE id = p_submission_id
    AND user_id = p_user_id
    AND quiz_id = p_quiz_id
    AND submitted_at IS NULL
  RETURNING * INTO v_updated_submission;

  IF NOT FOUND THEN
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
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UPDATE_FAILED',
      'message', 'Failed to update submission'
    );
  END IF;

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

  PERFORM add_quiz_points(
    p_user_id,
    p_total_score,
    p_is_late,
    p_quiz_start_at,
    p_submitted_at
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission', to_jsonb(v_updated_submission)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TRANSACTION_FAILED',
      'message', SQLERRM
    );
END;
$function$;
