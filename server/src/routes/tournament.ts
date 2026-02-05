import { Router, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { strictRateLimit } from '../middleware/rateLimit';

const router = Router();

// GET /api/tournament/:id/questions
// Returns questions WITHOUT correct answers
router.get('/:id/questions', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;

  try {
    // 1. Check if tournament exists and is active
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('quiz_type', 'tournament')
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const now = new Date();
    const startsAt = new Date(quiz.tournament_starts_at);
    const endsAt = new Date(quiz.tournament_ends_at);

    if (now < startsAt) {
      return res.status(400).json({ error: 'Tournament has not started yet' });
    }

    if (now > endsAt) {
      return res.status(400).json({ error: 'Tournament has ended' });
    }

    // 2. Check if user is registered
    const { data: registration } = await supabaseAdmin
      .from('tournament_registrations')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (!registration) {
      return res.status(403).json({ error: 'You are not registered for this tournament' });
    }

    // 3. Check if user already submitted
    const { data: existingSubmission } = await supabaseAdmin
      .from('tournament_submissions')
      .select('id, submitted_at')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (existingSubmission?.submitted_at) {
      return res.status(400).json({ error: 'You have already completed this tournament' });
    }

    // 4. Get questions WITHOUT correct_answer
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, question_type, options, points, order_index')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (questionsError) {
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // 5. Get saved answers if active submission exists (for resume functionality)
    let savedAnswers: Record<string, string> = {};
    if (existingSubmission && !existingSubmission.submitted_at) {
      const { data: answersData } = await supabaseAdmin
        .from('tournament_answers')
        .select('answers')
        .eq('quiz_id', quizId)
        .eq('user_id', userId)
        .maybeSingle();

      if (answersData?.answers && typeof answersData.answers === 'object') {
        savedAnswers = answersData.answers as Record<string, string>;
      }
    }

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        tournament_ends_at: quiz.tournament_ends_at,
        tournament_prize_gel: quiz.tournament_prize_gel,
      },
      questions,
      submission: existingSubmission || null,
      savedAnswers, // Return saved answers for resume
    });
  } catch (error) {
    console.error('Error fetching tournament questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournament/:id/start
// Creates a submission record when user starts the tournament
router.post('/:id/start', requireAuth, strictRateLimit, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;

  try {
    // Check if already started
    const { data: existing } = await supabaseAdmin
      .from('tournament_submissions')
      .select('id, started_at')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.json({ submission: existing, alreadyStarted: true });
    }

    // Create new submission
    const { data: submission, error } = await supabaseAdmin
      .from('tournament_submissions')
      .insert({
        quiz_id: quizId,
        user_id: userId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to start tournament' });
    }

    res.json({ submission, alreadyStarted: false });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournament/:id/submit
// Grades answers server-side and saves results
router.post('/:id/submit', requireAuth, strictRateLimit, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;
  const { answers } = req.body; // { questionId: userAnswer }

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers are required' });
  }

  try {
    // 1. Get the submission record
    const { data: submission, error: subError } = await supabaseAdmin
      .from('tournament_submissions')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (subError || !submission) {
      return res.status(400).json({ error: 'No active submission found' });
    }

    if (submission.submitted_at) {
      return res.status(400).json({ error: 'Already submitted' });
    }

    // 2. Check tournament hasn't ended and get full quiz data
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('tournament_ends_at, tournament_starts_at, start_at')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const now = new Date();
    const endsAt = new Date(quiz.tournament_ends_at);
    
    // Allow a small buffer (30 seconds) for network latency
    const bufferMs = 30 * 1000;
    if (now.getTime() > endsAt.getTime() + bufferMs) {
      return res.status(400).json({ error: 'Tournament has ended' });
    }

    // 3. Verify user is still registered (security check)
    const { data: registration } = await supabaseAdmin
      .from('tournament_registrations')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (!registration) {
      return res.status(403).json({ error: 'You are not registered for this tournament' });
    }

    // 4. Get correct answers from DB (server-side only!)
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, correct_answer')
      .eq('quiz_id', quizId);

    if (!questions || questions.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // 4.5. Validate and sanitize answers
    // Note: Unanswered questions are allowed (will be marked as incorrect)
    const MAX_ANSWER_LENGTH = 1000; // Maximum answer length
    const invalidAnswers: string[] = [];
    const sanitizedAnswers: Record<string, string> = {};

    questions.forEach((q) => {
      const answer = answers[q.id];
      
      // If no answer provided, treat as empty string (will be marked incorrect)
      if (!answer || (typeof answer === "string" && !answer.trim())) {
        sanitizedAnswers[q.id] = ""; // Empty answer = incorrect
        return;
      }

      // Validate answer format
      if (typeof answer !== "string") {
        invalidAnswers.push(q.id);
        return;
      }

      // Validate and sanitize answer length
      const sanitized = answer.trim().substring(0, MAX_ANSWER_LENGTH);
      sanitizedAnswers[q.id] = sanitized;
    });

    if (invalidAnswers.length > 0) {
      return res.status(400).json({
        error: "Some answers have invalid format",
        code: "INVALID_ANSWER_FORMAT",
      });
    }

    // 5. Grade answers (use sanitized answers)
    let totalScore = 0;
    const gradedAnswers: Record<string, { userAnswer: string; correct: boolean }> = {};

    questions?.forEach((q) => {
      // Use sanitized answer (empty string if not answered)
      const userAnswer = (sanitizedAnswers[q.id] || '').trim().toLowerCase();
      const correctAnswer = q.correct_answer.trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer && userAnswer.length > 0; // Empty answers are always incorrect
      
      if (isCorrect) {
        totalScore += 10;
      }
      
      gradedAnswers[q.id] = {
        userAnswer: sanitizedAnswers[q.id] || '', // Original sanitized answer
        correct: isCorrect,
      };
    });

    // 6. Calculate duration from TOURNAMENT START (not user start) using SERVER timestamps
    const submittedAt = new Date();
    const tournamentStartsAt = new Date(quiz.tournament_starts_at);
    const durationSeconds = Math.floor((submittedAt.getTime() - tournamentStartsAt.getTime()) / 1000);

    // 7. ATOMIC UPDATE: Update submission ONLY if not already submitted (race condition protection)
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('tournament_submissions')
      .update({
        submitted_at: submittedAt.toISOString(),
        total_score: totalScore,
        duration_seconds: durationSeconds,
      })
      .eq('id', submission.id)
      .eq('user_id', userId)
      .is('submitted_at', null) // CRITICAL: Only update if not already submitted
      .select()
      .single();

    // Check if update succeeded (race condition check)
    if (updateError || !updatedSubmission) {
      // Check if it was already submitted
      const { data: checkSubmission } = await supabaseAdmin
        .from('tournament_submissions')
        .select('submitted_at')
        .eq('id', submission.id)
        .eq('user_id', userId)
        .single();

      if (checkSubmission?.submitted_at) {
        return res.status(400).json({ error: 'Already submitted' });
      }

      return res.status(500).json({ error: 'Failed to save submission' });
    }

    // 8. Save answers to tournament_answers (use sanitized answers)
    const { error: answersError } = await supabaseAdmin
      .from('tournament_answers')
      .upsert({
        quiz_id: quizId,
        user_id: userId,
        answers: sanitizedAnswers, // Use sanitized answers (includes empty strings for unanswered)
        updated_at: submittedAt.toISOString(),
      }, { onConflict: 'quiz_id,user_id' });

    if (answersError) {
      console.error('Error saving tournament answers:', answersError);
      // Don't fail - submission is saved
    }

    // 9. Update user's total points using RPC (CRITICAL FIX: Tournament points were not being added!)
    try {
      await supabaseAdmin.rpc('add_tournament_points', {
        p_user_id: userId,
        p_points_to_add: totalScore,
        p_tournament_start_at: quiz.tournament_starts_at || quiz.start_at,
      });
    } catch (pointsError) {
      console.error('Error updating tournament points:', pointsError);
      // Don't fail - can reconcile later, but log the error
    }

    // 10. Return result (no correct answers revealed yet!)
    res.json({
      success: true,
      score: totalScore,
      duration_seconds: durationSeconds,
      total_questions: questions?.length || 0,
    });
  } catch (error) {
    console.error('Error submitting tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tournament/:id/results
// Returns tournament results - conditional based on results_released flag
router.get('/:id/results', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;

  try {
    // 1. Verify user has submitted
    const { data: submission, error: subError } = await supabaseAdmin
      .from('tournament_submissions')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (subError || !submission) {
      return res.status(404).json({ error: 'No submission found' });
    }

    if (!submission.submitted_at) {
      return res.status(400).json({
        error: 'You have not submitted this tournament yet',
        code: 'NOT_SUBMITTED'
      });
    }

    // 2. Get quiz info including results_released flag
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, tournament_prize_gel, results_released, tournament_starts_at')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const resultsReleased = quiz.results_released || false;

    // 3. Get user's answers
    const { data: answersData } = await supabaseAdmin
      .from('tournament_answers')
      .select('answers')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .maybeSingle();

    const userAnswers = (answersData?.answers || {}) as Record<string, string>;

    // Calculate duration from tournament start
    const submittedAt = new Date(submission.submitted_at);
    const tournamentStartsAt = new Date(quiz.tournament_starts_at);
    const durationFromStart = Math.floor((submittedAt.getTime() - tournamentStartsAt.getTime()) / 1000);

    // ========== RESULTS NOT RELEASED ==========
    if (!resultsReleased) {
      // Get questions WITHOUT correct answers
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id, question_text, order_index')
        .eq('quiz_id', quizId)
        .order('order_index');

      // Return user's answers without correct/incorrect indicators
      const questionsWithAnswersOnly = (questions || []).map((q) => ({
        id: q.id,
        question_text: q.question_text,
        order_index: q.order_index,
        user_answer: userAnswers[q.id] || '',
        // NO correct_answer, NO is_correct, NO points_earned
      }));

      return res.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          tournament_prize_gel: quiz.tournament_prize_gel,
        },
        resultsReleased: false,
        durationSeconds: durationFromStart,
        submittedAt: submission.submitted_at,
        questions: questionsWithAnswersOnly,
        // NO leaderboard, NO score, NO userRank
      });
    }

    // ========== RESULTS RELEASED ==========
    // Get questions WITH correct answers
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, correct_answer, points, order_index')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (questionsError) {
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Calculate is_correct for each answer (server-side)
    const questionsWithResults = (questions || []).map((q) => {
      const userAnswer = (userAnswers[q.id] || '').trim().toLowerCase();
      const correctAnswer = q.correct_answer.trim().toLowerCase();
      const is_correct = userAnswer === correctAnswer && userAnswer.length > 0;

      return {
        id: q.id,
        question_text: q.question_text,
        correct_answer: q.correct_answer,
        points: q.points,
        order_index: q.order_index,
        user_answer: userAnswers[q.id] || '',
        is_correct,
        points_earned: is_correct ? 10 : 0,
      };
    });

    // Get TOP 50 leaderboard
    const { data: leaderboardData } = await supabaseAdmin.rpc('get_tournament_leaderboard', {
      p_quiz_id: quizId,
      p_limit: 50,
    });

    // Get user's rank (in case they're outside top 50)
    const { data: userRankData } = await supabaseAdmin.rpc('get_user_tournament_rank', {
      p_quiz_id: quizId,
      p_user_id: userId,
    });

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        tournament_prize_gel: quiz.tournament_prize_gel,
      },
      resultsReleased: true,
      durationSeconds: durationFromStart,
      submittedAt: submission.submitted_at,
      submission: {
        id: submission.id,
        total_score: submission.total_score,
        submitted_at: submission.submitted_at,
      },
      questions: questionsWithResults,
      userAnswers,
      leaderboard: leaderboardData || [],
      userRank: userRankData?.[0] || null,
    });
  } catch (error) {
    console.error('Error fetching tournament results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tournament/:id/save-answers
// Saves answers incrementally (auto-save) for active submission
router.post('/:id/save-answers', requireAuth, strictRateLimit, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;
  const { answers } = req.body; // { questionId: userAnswer }

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers are required' });
  }

  try {
    // 1. Verify user has active submission (started but not submitted)
    const { data: submission, error: subError } = await supabaseAdmin
      .from('tournament_submissions')
      .select('id, submitted_at')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .single();

    if (subError || !submission) {
      return res.status(400).json({ error: 'No active submission found' });
    }

    if (submission.submitted_at) {
      return res.status(400).json({ error: 'Submission already completed' });
    }

    // 2. Verify tournament is still active
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('tournament_ends_at')
      .eq('id', quizId)
      .eq('quiz_type', 'tournament')
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const now = new Date();
    const endsAt = new Date(quiz.tournament_ends_at);

    if (now > endsAt) {
      return res.status(400).json({ error: 'Tournament has ended' });
    }

    // 3. Validate and sanitize answers
    const MAX_ANSWER_LENGTH = 1000;
    const sanitizedAnswers: Record<string, string> = {};

    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer !== 'string') {
        continue; // Skip invalid answers
      }
      // Sanitize: trim and limit length
      const sanitized = answer.trim().substring(0, MAX_ANSWER_LENGTH);
      if (sanitized.length > 0) {
        sanitizedAnswers[questionId] = sanitized;
      }
    }

    // 4. Upsert answers to tournament_answers table
    const { error: saveError } = await supabaseAdmin
      .from('tournament_answers')
      .upsert({
        quiz_id: quizId,
        user_id: userId,
        answers: sanitizedAnswers,
        updated_at: now.toISOString(),
      }, { onConflict: 'quiz_id,user_id' });

    if (saveError) {
      console.error('Error saving tournament answers:', saveError);
      return res.status(500).json({ error: 'Failed to save answers' });
    }

    res.json({ success: true, savedCount: Object.keys(sanitizedAnswers).length });
  } catch (error) {
    console.error('Error saving tournament answers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tournament/:id/state
// Returns server-calculated tournament state (prevents client-side time manipulation)
router.get('/:id/state', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;

  try {
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .select('tournament_starts_at, tournament_ends_at, registration_opens_at, registration_closes_at')
      .eq('id', quizId)
      .eq('quiz_type', 'tournament')
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const now = new Date();
    const serverTime = now.toISOString();

    // Check registration
    const { data: registration } = await supabaseAdmin
      .from('tournament_registrations')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .maybeSingle();

    const isRegistered = !!registration;

    // Check submission
    const { data: submission } = await supabaseAdmin
      .from('tournament_submissions')
      .select('submitted_at')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .maybeSingle();

    const hasSubmitted = !!submission?.submitted_at;

    // Calculate state server-side
    let state: 'NOT_STARTED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ACTIVE' | 'ENDED' | 'ALREADY_SUBMITTED';

    if (hasSubmitted) {
      state = 'ALREADY_SUBMITTED';
    } else if (!quiz.tournament_starts_at || !quiz.tournament_ends_at) {
      state = 'NOT_STARTED';
    } else {
      const startsAt = new Date(quiz.tournament_starts_at);
      const endsAt = new Date(quiz.tournament_ends_at);
      const regOpens = quiz.registration_opens_at ? new Date(quiz.registration_opens_at) : null;
      const regCloses = quiz.registration_closes_at ? new Date(quiz.registration_closes_at) : null;

      if (now < startsAt) {
        if (regOpens && regCloses) {
          if (now < regOpens) {
            state = 'NOT_STARTED';
          } else if (now >= regOpens && now < regCloses) {
            state = 'REGISTRATION_OPEN';
          } else {
            state = 'REGISTRATION_CLOSED';
          }
        } else {
          state = 'NOT_STARTED';
        }
      } else if (now >= startsAt && now < endsAt) {
        state = 'ACTIVE';
      } else {
        state = 'ENDED';
      }
    }

    res.json({
      state,
      isRegistered,
      hasSubmitted,
      serverTime,
      tournament_starts_at: quiz.tournament_starts_at,
      tournament_ends_at: quiz.tournament_ends_at,
      registration_opens_at: quiz.registration_opens_at,
      registration_closes_at: quiz.registration_closes_at,
    });
  } catch (error) {
    console.error('Error fetching tournament state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
