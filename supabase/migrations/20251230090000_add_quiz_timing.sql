-- ============================================================
-- Migration: Add timing columns to quiz_submissions for secure backend
-- ============================================================
-- 
-- This migration adds columns needed for server-side quiz tracking:
-- - started_at: When user began the quiz
-- - duration_seconds: How long they took
--
-- Run this migration:
--   supabase db push
-- Or apply via Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Add started_at column to track when user begins quiz
ALTER TABLE public.quiz_submissions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- 2. Add duration_seconds to track how long user took
ALTER TABLE public.quiz_submissions 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- 3. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_started_at 
ON public.quiz_submissions(started_at);

-- 4. Update RLS policies for quiz_submissions
-- Users can only update their own submissions
DROP POLICY IF EXISTS "Users can update own submissions" ON public.quiz_submissions;

CREATE POLICY "Users can update own submissions" ON public.quiz_submissions
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own submissions
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.quiz_submissions;

CREATE POLICY "Users can insert own submissions" ON public.quiz_submissions
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.quiz_submissions;

CREATE POLICY "Users can view own submissions" ON public.quiz_submissions
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================================
-- SECURITY: Create a safe function to get questions without correct_answer
-- ============================================================

-- This function returns questions WITHOUT the correct_answer field
-- Use this instead of direct table access for extra security
CREATE OR REPLACE FUNCTION public.get_quiz_questions_safe(p_quiz_id UUID)
RETURNS TABLE (
  id UUID,
  quiz_id UUID,
  question_text TEXT,
  question_type public.question_type,
  options JSONB,
  points INTEGER,
  order_index INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    quiz_id,
    question_text,
    question_type,
    options,
    points,
    order_index
  FROM public.questions
  WHERE quiz_id = p_quiz_id
  ORDER BY order_index;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_quiz_questions_safe(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_quiz_questions_safe IS 
'Returns quiz questions WITHOUT correct_answer for security. 
Use this instead of direct table access in frontend queries.';

-- ============================================================
-- Optional: Stricter RLS for questions table
-- ============================================================
-- 
-- NOTE: These policies make the questions table more secure,
-- but you should use the backend API which handles security properly.
-- 
-- Uncomment if you want extra protection:

-- Only allow reading questions through the safe function or backend
-- DROP POLICY IF EXISTS "Users can view questions" ON public.questions;
-- 
-- CREATE POLICY "Users can view questions for started quizzes" ON public.questions
--   FOR SELECT TO authenticated USING (
--     EXISTS (
--       SELECT 1 FROM public.quizzes 
--       WHERE id = quiz_id 
--       AND start_at <= now()
--     )
--   );

-- ============================================================
-- Verify migration
-- ============================================================

-- Check columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_submissions' AND column_name = 'started_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: started_at column not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_submissions' AND column_name = 'duration_seconds'
  ) THEN
    RAISE EXCEPTION 'Migration failed: duration_seconds column not created';
  END IF;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;