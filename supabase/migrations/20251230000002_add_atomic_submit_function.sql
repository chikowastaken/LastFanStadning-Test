-- Atomic quiz submission function
-- This function handles the entire submission process in a single transaction:
-- 1. Updates quiz_submissions (with atomic check for race condition)
-- 2. Inserts user_answers
-- 3. Updates user points via add_quiz_points
-- All operations succeed or fail together

CREATE OR REPLACE FUNCTION public.submit_quiz_atomic(
  p_submission_id UUID,
  p_user_id UUID,
  p_quiz_id UUID,
  p_submitted_at TIMESTAMPTZ,
  p_total_score INTEGER,
  p_is_late BOOLEAN,
  p_duration_seconds INTEGER,
  p_quiz_start_at TIMESTAMPTZ,
  p_answers JSONB -- Array of {question_id, answer, is_correct, points_earned}
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;