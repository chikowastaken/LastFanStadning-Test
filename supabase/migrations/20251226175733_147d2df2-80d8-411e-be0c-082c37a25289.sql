-- First drop the dependent policy
DROP POLICY IF EXISTS "Users can view questions for unlocked quizzes" ON public.questions;

-- Remove starts_at and ends_at columns from quizzes table
ALTER TABLE public.quizzes DROP COLUMN starts_at;
ALTER TABLE public.quizzes DROP COLUMN ends_at;

-- Create new policy for viewing questions based on is_locked
CREATE POLICY "Users can view questions for unlocked quizzes" 
ON public.questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM quizzes
    WHERE quizzes.id = questions.quiz_id
      AND quizzes.is_locked = false
  )
);