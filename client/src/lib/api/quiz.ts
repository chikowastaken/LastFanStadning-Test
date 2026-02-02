/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Quiz API Client
 * Secure API calls to the backend for quiz operations
 *
 * SECURITY: All grading happens server-side
 * - Questions endpoint does NOT return correct_answer (except in practice mode)
 * - Submit endpoint grades answers on server, returns only score
 * - Results endpoint returns correct_answer only AFTER submission
 */

import { supabase } from "@/integrations/supabase/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ============ Auth Helper ============

/**
 * Get the current user's JWT token for API authentication
 */
async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || "API request failed");
    (error as any).code = data.code;
    (error as any).redirectTo = data.redirectTo;
    throw error;
  }

  return data;
}

// ============ Type Definitions ============

export type QuizState = "NOT_STARTED" | "LIVE" | "LATE" | "EXPIRED";

export interface QuizInfo {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    day_number: number;
    is_locked: boolean;
  };
  state: QuizState;
  pointsPerCorrect: number;
  questionCount: number;
  hasSubmitted: boolean;
  submission: QuizSubmission | null;
  canPlay: boolean;
  canPractice: boolean;
  serverTime: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "text_input";
  options: string[] | null;
  points: number;
  order_index: number;
  correct_answer?: string; // Only present in practice mode or results
}

export interface QuizQuestionsResponse {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
  };
  questions: QuizQuestion[];
  state: QuizState;
  pointsPerCorrect: number;
  isPractice: boolean;
  submission: QuizSubmission | null;
  serverTime: string;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  user_id: string;
  total_score: number;
  is_late: boolean;
  submitted_at: string | null;
  started_at: string | null;
  duration_seconds: number | null;
}

export interface StartQuizResponse {
  submission: QuizSubmission;
  alreadyStarted: boolean;
  state: QuizState;
}

export interface SubmitQuizResponse {
  success: boolean;
  score: number;
  totalQuestions: number;
  correctCount: number;
  isLate: boolean;
  pointsPerCorrect: number;
  durationSeconds: number;
}

export interface QuizResultsResponse {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    day_number: number;
  };
  submission: QuizSubmission;
  questions: Array<QuizQuestion & { correct_answer?: string }>; // correct_answer only present after quiz ends
  userAnswers: Array<{
    id: string;
    submission_id: string;
    question_id: string;
    answer: string;
    is_correct: boolean;
    points_earned: number;
  }>;
  answersRevealed: boolean; // true if quiz.end_at has passed
  answersRevealTime: string; // ISO timestamp when answers will be revealed
  serverTime: string; // Server's current time
}

// ============ API Functions ============

/**
 * Get list of all quizzes with server-calculated states
 * This provides server-side time validation for the dashboard
 */
export async function getQuizList(): Promise<{
  quizzes: Array<{
    id: string;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    day_number: number;
    is_locked: boolean;
    state: QuizState;
    pointsPerCorrect: number;
    canSubmit: boolean;
    hasSubmitted: boolean;
    submission: QuizSubmission | null;
  }>;
  serverTime: string;
}> {
  return apiRequest(`/api/quiz/list`);
}

/**
 * Get quiz info and check if user can play
 * This is a lightweight check before loading questions
 */
export async function getQuizInfo(quizId: string): Promise<QuizInfo> {
  return apiRequest<QuizInfo>(`/api/quiz/${quizId}`);
}

/**
 * Get quiz questions
 *
 * SECURITY: In play mode, correct_answer is NOT returned
 * In practice mode, correct_answer IS returned (user already submitted)
 */
export async function getQuizQuestions(
  quizId: string,
  isPractice: boolean = false
): Promise<QuizQuestionsResponse> {
  const query = isPractice ? "?practice=true" : "";
  return apiRequest<QuizQuestionsResponse>(
    `/api/quiz/${quizId}/questions${query}`
  );
}

/**
 * Start the quiz
 * Records the start time for duration tracking
 */
export async function startQuiz(quizId: string): Promise<StartQuizResponse> {
  return apiRequest<StartQuizResponse>(`/api/quiz/${quizId}/start`, {
    method: "POST",
  });
}

/**
 * Submit quiz answers
 *
 * SECURITY: Grading happens SERVER-SIDE
 * - Server fetches correct answers from DB
 * - Server calculates score
 * - Server determines if submission is late
 * - Only score is returned (no correct answers)
 */
export async function submitQuiz(
  quizId: string,
  answers: Record<string, string>
): Promise<SubmitQuizResponse> {
  return apiRequest<SubmitQuizResponse>(`/api/quiz/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

/**
 * Get quiz results
 *
 * SECURITY: Correct answers are returned only AFTER submission
 * This endpoint validates that user has already submitted
 */
export async function getQuizResults(
  quizId: string
): Promise<QuizResultsResponse> {
  return apiRequest<QuizResultsResponse>(`/api/quiz/${quizId}/results`);
}

// ============ Export ============

export const quizApi = {
  getList: getQuizList,
  getInfo: getQuizInfo,
  getQuestions: getQuizQuestions,
  start: startQuiz,
  submit: submitQuiz,
  getResults: getQuizResults,
};

export default quizApi;
