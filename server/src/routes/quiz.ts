import { Router, Response } from "express";
import { supabaseAdmin } from "../services/supabase";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { strictRateLimit } from "../middleware/rateLimit";

const router = Router();

// ============ Helper Functions ============

interface QuizState {
  state: "NOT_STARTED" | "LIVE" | "LATE" | "EXPIRED";
  pointsPerCorrect: number;
  canSubmit: boolean;
}

/**
 * Determine quiz state and points based on server time
 */
function getQuizState(quiz: any): QuizState {
  const now = new Date();
  const startAt = new Date(quiz.start_at);
  const endAt = new Date(quiz.end_at);

  // Before quiz starts
  if (now < startAt) {
    return { state: "NOT_STARTED", pointsPerCorrect: 0, canSubmit: false };
  }

  // During live period (full points)
  if (now >= startAt && now <= endAt) {
    return { state: "LIVE", pointsPerCorrect: 10, canSubmit: true };
  }

  // After end_at: Always allowed as LATE (half points)
  return { state: "LATE", pointsPerCorrect: 5, canSubmit: true };
}

/**
 * Normalize answer for comparison (trim, lowercase)
 */
function normalizeAnswer(answer: string): string {
  return (answer || "").trim().toLowerCase();
}

// ============ Routes ============

/**
 * GET /api/quiz/list
 * Get all daily quizzes with server-calculated states
 * This endpoint provides server-side time validation for the dashboard
 */
router.get("/list", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    // 1. Get all daily quizzes
    const { data: quizzes, error: quizzesError } = await supabaseAdmin
      .from("quizzes")
      .select("id, title, description, start_at, end_at, is_locked, quiz_type, day_number")
      .eq("quiz_type", "daily")
      .order("day_number", { ascending: false });

    if (quizzesError) {
      return res.status(500).json({ error: "Failed to fetch quizzes" });
    }

    // 2. Get user's submissions
    const { data: submissions } = await supabaseAdmin
      .from("quiz_submissions")
      .select("quiz_id, total_score, submitted_at")
      .eq("user_id", userId);

    const submissionsMap = new Map(
      (submissions || []).map((s) => [s.quiz_id, s])
    );

    // 3. Calculate state for each quiz using SERVER time
    const quizzesWithState = (quizzes || []).map((quiz) => {
      const { state, pointsPerCorrect, canSubmit } = getQuizState(quiz);
      const submission = submissionsMap.get(quiz.id);
      const hasSubmitted = !!submission?.submitted_at;

      return {
        ...quiz,
        state, // Server-calculated state
        pointsPerCorrect,
        canSubmit,
        hasSubmitted,
        submission: submission || null,
      };
    });

    res.json({
      quizzes: quizzesWithState,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching quiz list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/quiz/:id
 * Get quiz info and check if user can play
 */
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: quizId } = req.params;
  const userId = req.user!.id;

  try {
    // 1. Get quiz (only daily quizzes, not tournaments)
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from("quizzes")
      .select(
        "id, title, description, start_at, end_at, is_locked, quiz_type, day_number"
      )
      .eq("id", quizId)
      .eq("quiz_type", "daily")
      .single();

    if (quizError || !quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // 2. Check if user already submitted
    const { data: existingSubmission } = await supabaseAdmin
      .from("quiz_submissions")
      .select(
        "id, total_score, is_late, submitted_at, started_at, duration_seconds"
      )
      .eq("quiz_id", quizId)
      .eq("user_id", userId)
      .single();

    // 3. Get quiz state (determined by SERVER time)
    const { state, pointsPerCorrect, canSubmit } = getQuizState(quiz);

    // 4. Get question count
    const { count: questionCount } = await supabaseAdmin
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId);

    // 5. Determine user's access rights
    const hasSubmitted = !!existingSubmission?.submitted_at;
    const canPlay = !hasSubmitted && canSubmit;
    const canPractice = hasSubmitted; // Can practice after completing

    res.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        start_at: quiz.start_at,
        end_at: quiz.end_at,
        day_number: quiz.day_number,
        is_locked: quiz.is_locked,
      },
      state,
      pointsPerCorrect,
      questionCount: questionCount || 0,
      hasSubmitted,
      submission: existingSubmission || null,
      canPlay,
      canPractice,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/quiz/:id/questions
 * Get questions WITHOUT correct_answer (secure endpoint)
 * In practice mode, correct_answer IS returned (user already submitted)
 */
router.get(
  "/:id/questions",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id: quizId } = req.params;
    const userId = req.user!.id;
    const isPractice = req.query.practice === "true";

    try {
      // 1. Get quiz
      const { data: quiz, error: quizError } = await supabaseAdmin
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("quiz_type", "daily")
        .single();

      if (quizError || !quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const { state, pointsPerCorrect, canSubmit } = getQuizState(quiz);

      // 2. Check existing submission
      const { data: existingSubmission } = await supabaseAdmin
        .from("quiz_submissions")
        .select("id, total_score, is_late, submitted_at, started_at")
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
        .single();

      const hasSubmitted = !!existingSubmission?.submitted_at;

      // 3. Validate access based on mode
      if (isPractice) {
        // Practice mode: ONLY allowed after user has submitted
        if (!hasSubmitted) {
          return res.status(403).json({
            error:
              "პრაქტიკის რეჟიმი ხელმისაწვდომია მხოლოდ ქვიზის შესრულების შემდეგ",
            code: "PRACTICE_NOT_ALLOWED",
          });
        }
      } else {
        // Play mode validation
        if (hasSubmitted) {
          return res.status(400).json({
            error: "თქვენ უკვე შეასრულეთ ეს ქვიზი",
            code: "ALREADY_SUBMITTED",
            redirectTo: `/quiz/${quizId}/results`,
          });
        }

        if (state === "NOT_STARTED") {
          return res.status(400).json({
            error: "ქვიზი ჯერ არ დაწყებულა",
            code: "NOT_STARTED",
          });
        }

        if (!canSubmit) {
          return res.status(400).json({
            error: "ქვიზის შესრულების დრო ამოიწურა",
            code: "EXPIRED",
          });
        }
      }

      // 4. Get questions - CRITICAL: Never send correct_answer in play mode!
      const selectFields = isPractice
        ? "id, question_text, question_type, options, points, order_index, correct_answer"
        : "id, question_text, question_type, options, points, order_index";

      const { data: questions, error: questionsError } = await supabaseAdmin
        .from("questions")
        .select(selectFields)
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsError) {
        console.error("Error fetching questions:", questionsError);
        return res
          .status(500)
          .json({ error: "კითხვების ჩატვირთვა ვერ მოხერხდა" });
      }

      res.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          start_at: quiz.start_at,
          end_at: quiz.end_at,
        },
        questions: questions || [],
        state,
        pointsPerCorrect,
        isPractice,
        submission: existingSubmission || null,
        serverTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/quiz/:id/start
 * Record when user starts the quiz (for timing tracking)
 */
router.post(
  "/:id/start",
  requireAuth,
  strictRateLimit,
  async (req: AuthRequest, res: Response) => {
    const { id: quizId } = req.params;
    const userId = req.user!.id;

    try {
      // 1. Verify quiz exists and is playable
      const { data: quiz } = await supabaseAdmin
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("quiz_type", "daily")
        .single();

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const { state, canSubmit } = getQuizState(quiz);

      if (state === "NOT_STARTED") {
        return res.status(400).json({ error: "ქვიზი ჯერ არ დაწყებულა" });
      }

      if (!canSubmit) {
        return res
          .status(400)
          .json({ error: "ქვიზის შესრულების დრო ამოიწურა" });
      }

      // 2. Check if user already has a submission
      const { data: existing } = await supabaseAdmin
        .from("quiz_submissions")
        .select("id, started_at, submitted_at")
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
        .single();

      // Already submitted - redirect to results
      if (existing?.submitted_at) {
        return res.status(400).json({
          error: "უკვე შესრულებულია",
          code: "ALREADY_SUBMITTED",
          redirectTo: `/quiz/${quizId}/results`,
        });
      }

      // Already started but not submitted - return existing
      if (existing?.started_at) {
        return res.json({
          submission: existing,
          alreadyStarted: true,
          state,
        });
      }

      // 3. Create new submission record with started_at
      const { data: submission, error } = await supabaseAdmin
        .from("quiz_submissions")
        .insert({
          quiz_id: quizId,
          user_id: userId,
          started_at: new Date().toISOString(),
          total_score: 0,
          is_late: state === "LATE",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating submission:", error);
        return res.status(500).json({ error: "ქვიზის დაწყება ვერ მოხერხდა" });
      }

      res.json({
        submission,
        alreadyStarted: false,
        state,
      });
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/quiz/:id/submit
 * Grade answers SERVER-SIDE and save results
 * This is the most critical security endpoint!
 */
router.post(
  "/:id/submit",
  requireAuth,
  strictRateLimit,
  async (req: AuthRequest, res: Response) => {
    const { id: quizId } = req.params;
    const userId = req.user!.id;
    const { answers } = req.body; // { questionId: userAnswer }

    // Validate input
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "პასუხები აუცილებელია" });
    }

    try {
      // 1. Get the submission record (must have started)
      const { data: submission, error: subError } = await supabaseAdmin
        .from("quiz_submissions")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
        .single();

      if (subError || !submission) {
        return res.status(400).json({
          error: "ჯერ უნდა დაიწყოთ ქვიზი",
          code: "NOT_STARTED",
        });
      }

      // Early check for already submitted (optimization - but not relied upon for security)
      if (submission.submitted_at) {
        return res.status(400).json({
          error: "თქვენ უკვე გაგზავნეთ პასუხები",
          code: "ALREADY_SUBMITTED",
        });
      }

      // 2. Get quiz and determine state SERVER-SIDE (critical for isLate!)
      const { data: quiz } = await supabaseAdmin
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const { state, pointsPerCorrect, canSubmit } = getQuizState(quiz);

      if (!canSubmit) {
        return res.status(400).json({
          error: "ქვიზის შესრულების დრო ჯერ არ დაწყებულა",
          code: "NOT_STARTED",
        });
      }

      // Determine if late (SERVER-SIDE - cannot be manipulated!)
      const isLate = state === "LATE";
      const actualPointsPerCorrect = isLate ? 5 : 10;

      // 3. Get correct answers from DB (SERVER-SIDE ONLY!)
      const { data: questions } = await supabaseAdmin
        .from("questions")
        .select("id, correct_answer, points, question_type")
        .eq("quiz_id", quizId);

      if (!questions || questions.length === 0) {
        return res.status(500).json({ error: "კითხვები ვერ მოიძებნა" });
      }

      // 3.5. Validate answers - ensure all questions have answers and validate format
      const MAX_ANSWER_LENGTH = 1000; // Maximum answer length
      const missingAnswers: string[] = [];
      const invalidAnswers: string[] = [];

      questions.forEach((q) => {
        const answer = answers[q.id];
        
        // Check if answer is provided
        if (!answer || (typeof answer === "string" && !answer.trim())) {
          missingAnswers.push(q.id);
          return;
        }

        // Validate answer format
        if (typeof answer !== "string") {
          invalidAnswers.push(q.id);
          return;
        }

        // Validate answer length
        if (answer.length > MAX_ANSWER_LENGTH) {
          invalidAnswers.push(q.id);
          return;
        }
      });

      if (missingAnswers.length > 0) {
        return res.status(400).json({
          error: `გთხოვთ უპასუხოთ ყველა კითხვას (${missingAnswers.length} შეუვსებელი)`,
          code: "MISSING_ANSWERS",
          missingCount: missingAnswers.length,
        });
      }

      if (invalidAnswers.length > 0) {
        return res.status(400).json({
          error: "ზოგიერთ პასუხს აქვს არასწორი ფორმატი",
          code: "INVALID_ANSWER_FORMAT",
        });
      }

      // 4. Grade answers SERVER-SIDE (the secure part!)
      let totalScore = 0;
      let correctCount = 0;
      const gradedResults: Array<{
        question_id: string;
        answer: string;
        is_correct: boolean;
        points_earned: number;
      }> = [];

      questions.forEach((q) => {
        const userAnswer = normalizeAnswer(answers[q.id]);
        const correctAnswer = normalizeAnswer(q.correct_answer);
        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {
          correctCount++;
          totalScore += actualPointsPerCorrect;
        }

        gradedResults.push({
          question_id: q.id,
          answer: answers[q.id] || "",
          is_correct: isCorrect,
          points_earned: isCorrect ? actualPointsPerCorrect : 0,
        });
      });

      // 5. Calculate duration using SERVER timestamps (anti-cheat)
      const submittedAt = new Date();
      const startedAt = submission.started_at
        ? new Date(submission.started_at)
        : submittedAt;
      const durationSeconds = Math.floor(
        (submittedAt.getTime() - startedAt.getTime()) / 1000
      );

      // 6. ATOMIC TRANSACTION: Submit quiz using database function
      // This ensures all operations (update submission, insert answers, update points)
      // happen atomically - either all succeed or all fail together
      const answersJson = gradedResults.map((r) => ({
        question_id: r.question_id,
        answer: r.answer,
        is_correct: r.is_correct,
        points_earned: r.points_earned,
      }));

      const { data: submitResult, error: submitError } = await supabaseAdmin.rpc(
        "submit_quiz_atomic",
        {
          p_submission_id: submission.id,
          p_user_id: userId,
          p_quiz_id: quizId,
          p_submitted_at: submittedAt.toISOString(),
          p_total_score: totalScore,
          p_is_late: isLate,
          p_duration_seconds: durationSeconds,
          p_quiz_start_at: quiz.start_at,
          p_answers: answersJson,
        }
      );

      // Handle errors from RPC call
      if (submitError) {
        console.error("Error calling atomic submission function:", submitError);
        return res.status(500).json({ error: "შედეგის შენახვა ვერ მოხერხდა" });
      }

      // Check result from function (data is the JSONB returned from the function)
      if (!submitResult || !submitResult.success) {
        const errorCode = submitResult?.error || "UNKNOWN_ERROR";
        const errorMessage = submitResult?.message || "შედეგის შენახვა ვერ მოხერხდა";

        if (errorCode === "ALREADY_SUBMITTED") {
          return res.status(400).json({
            error: "თქვენ უკვე გაგზავნეთ პასუხები",
            code: "ALREADY_SUBMITTED",
          });
        }

        console.error("Atomic submission failed:", errorCode, errorMessage);
        return res.status(500).json({ error: errorMessage });
      }

      // 9. Return result (NO correct answers - security!)
      res.json({
        success: true,
        score: totalScore,
        totalQuestions: questions.length,
        correctCount,
        isLate,
        pointsPerCorrect: actualPointsPerCorrect,
        durationSeconds,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/quiz/:id/results
 * Get user's quiz results (only AFTER submission)
 * 
 * SECURITY: Correct answers are only revealed AFTER quiz.end_at
 * This prevents users from sharing answers with others during the quiz window
 */
router.get(
  "/:id/results",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id: quizId } = req.params;
    const userId = req.user!.id;

    try {
      // 1. Get submission - must have submitted
      const { data: submission } = await supabaseAdmin
        .from("quiz_submissions")
        .select("*")
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
        .single();

      if (!submission) {
        return res.status(404).json({
          error: "შედეგები ვერ მოიძებნა",
          code: "NO_SUBMISSION",
        });
      }

      if (!submission.submitted_at) {
        return res.status(400).json({
          error: "ქვიზი ჯერ არ დასრულებულა",
          code: "NOT_SUBMITTED",
          redirectTo: `/quiz/${quizId}`,
        });
      }

      // 2. Get quiz info
      const { data: quiz } = await supabaseAdmin
        .from("quizzes")
        .select("id, title, description, start_at, end_at, day_number")
        .eq("id", quizId)
        .single();

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // 3. SECURITY CHECK: Only reveal correct answers after quiz.end_at
      const now = new Date();
      const quizEndTime = new Date(quiz.end_at);
      const answersRevealed = now >= quizEndTime;

      // 4. Get questions - conditionally include correct_answer
      const { data: questions } = await supabaseAdmin
        .from("questions")
        .select(
          "id, question_text, question_type, options, correct_answer, points, order_index"
        )
        .eq("quiz_id", quizId)
        .order("order_index");

      // 5. Get user's answers
      const { data: userAnswers } = await supabaseAdmin
        .from("user_answers")
        .select("*")
        .eq("submission_id", submission.id);

      // 6. SECURITY: If answers not revealed, only send minimal data
      if (answersRevealed) {
        // After quiz ends: send full data including correct answers
        res.json({
          quiz,
          submission,
          questions: questions || [],
          userAnswers: userAnswers || [],
          answersRevealed: true,
          answersRevealTime: quiz.end_at,
          serverTime: now.toISOString(),
        });
      } else {
        // Before quiz ends: send questions and user's answers, but NOT correct_answer, is_correct, or points_earned
        const safeQuestions = (questions || []).map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          points: q.points,
          order_index: q.order_index,
          // correct_answer is NOT included
        }));

        const safeUserAnswers = (userAnswers || []).map((a) => ({
          id: a.id,
          submission_id: a.submission_id,
          question_id: a.question_id,
          answer: a.answer,
          // is_correct is NOT included
          // points_earned is NOT included
        }));

        res.json({
          quiz,
          submission: {
            id: submission.id,
            quiz_id: submission.quiz_id,
            user_id: submission.user_id,
            total_score: submission.total_score,
            is_late: submission.is_late,
            submitted_at: submission.submitted_at,
            started_at: submission.started_at,
            duration_seconds: submission.duration_seconds,
          },
          questions: safeQuestions,
          userAnswers: safeUserAnswers,
          answersRevealed: false,
          answersRevealTime: quiz.end_at,
          serverTime: now.toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
