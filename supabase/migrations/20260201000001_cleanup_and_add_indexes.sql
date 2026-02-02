-- ============================================================
-- Migration: Database Cleanup & Performance Indexes
-- Date: 2026-02-01
-- Purpose: Fresh start - cleared all quiz/tournament data, reset points, added indexes
-- ============================================================
-- 
-- WHAT WAS DONE (run manually in Supabase Dashboard):
-- 1. Truncated: quizzes, questions, quiz_submissions, user_answers,
--    tournament_registrations, tournament_submissions, tournament_answers
-- 2. Reset profiles: total_points, weekly_points, monthly_points → 0
-- 3. Added performance indexes (below)
--
-- WHAT WAS KEPT:
-- - auth.users (all user accounts)
-- - profiles (user data, just reset points)
-- - user_roles (admin/user assignments)
-- ============================================================

-- Performance Indexes (IF NOT EXISTS for idempotency)

-- Quiz Submissions indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_quiz 
  ON public.quiz_submissions(user_id, quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id 
  ON public.quiz_submissions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_submitted_at 
  ON public.quiz_submissions(submitted_at) 
  WHERE submitted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id 
  ON public.quiz_submissions(user_id);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id 
  ON public.questions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_order 
  ON public.questions(quiz_id, order_index);

-- User Answers index
CREATE INDEX IF NOT EXISTS idx_user_answers_submission_id 
  ON public.user_answers(submission_id);

-- Tournament Submissions indexes
CREATE INDEX IF NOT EXISTS idx_tournament_submissions_quiz_user 
  ON public.tournament_submissions(quiz_id, user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_submissions_quiz_id 
  ON public.tournament_submissions(quiz_id);

CREATE INDEX IF NOT EXISTS idx_tournament_submissions_submitted 
  ON public.tournament_submissions(quiz_id, submitted_at) 
  WHERE submitted_at IS NOT NULL;

-- Tournament Registrations indexes
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_quiz_user 
  ON public.tournament_registrations(quiz_id, user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_quiz_id 
  ON public.tournament_registrations(quiz_id);

-- Tournament Answers index
CREATE INDEX IF NOT EXISTS idx_tournament_answers_quiz_user 
  ON public.tournament_answers(quiz_id, user_id);

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type 
  ON public.quizzes(quiz_type);

CREATE INDEX IF NOT EXISTS idx_quizzes_start_at 
  ON public.quizzes(start_at);

CREATE INDEX IF NOT EXISTS idx_quizzes_type_start 
  ON public.quizzes(quiz_type, start_at);

-- Profiles indexes (for leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_profiles_total_points 
  ON public.profiles(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_weekly_points 
  ON public.profiles(weekly_points DESC) 
  WHERE weekly_points > 0;

CREATE INDEX IF NOT EXISTS idx_profiles_monthly_points 
  ON public.profiles(monthly_points DESC) 
  WHERE monthly_points > 0;
