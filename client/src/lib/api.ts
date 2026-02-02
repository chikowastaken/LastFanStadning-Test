const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get the current session token from Supabase
  const { supabase } = await import("@/integrations/supabase/client");
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Tournament API functions
export const tournamentApi = {
  getQuestions: (quizId: string) =>
    apiRequest<{
      quiz: any;
      questions: any[];
      submission: any;
      savedAnswers?: Record<string, string>; // Added for resume functionality
    }>(`/api/tournament/${quizId}/questions`),

  start: (quizId: string) =>
    apiRequest<{
      submission: any;
      alreadyStarted: boolean;
    }>(`/api/tournament/${quizId}/start`, { method: "POST" }),

  submit: (quizId: string, answers: Record<string, string>) =>
    apiRequest<{
      success: boolean;
      score: number;
      duration_seconds: number;
      total_questions: number;
    }>(`/api/tournament/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  getResults: (quizId: string) =>
    apiRequest<{
      quiz: {
        id: string;
        title: string;
        tournament_prize_gel: number | null;
      };
      submission: {
        id: string;
        total_score: number;
        duration_seconds: number;
        submitted_at: string;
      };
      questions: Array<{
        id: string;
        question_text: string;
        correct_answer: string;
        points: number;
        order_index: number;
        user_answer: string;
        is_correct: boolean;
        points_earned: number;
      }>;
      userAnswers: Record<string, string>;
      leaderboard: Array<{
        user_id: string;
        total_score: number;
        duration_seconds: number;
        rank: number;
      }>;
    }>(`/api/tournament/${quizId}/results`),

  getState: (quizId: string) =>
    apiRequest<{
      state: 'NOT_STARTED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ACTIVE' | 'ENDED' | 'ALREADY_SUBMITTED';
      isRegistered: boolean;
      hasSubmitted: boolean;
      serverTime: string;
      tournament_starts_at: string | null;
      tournament_ends_at: string | null;
      registration_opens_at: string | null;
      registration_closes_at: string | null;
    }>(`/api/tournament/${quizId}/state`),

  saveAnswers: (quizId: string, answers: Record<string, string>) =>
    apiRequest<{
      success: boolean;
      savedCount: number;
    }>(`/api/tournament/${quizId}/save-answers`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};
