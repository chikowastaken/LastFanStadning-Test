/**
 * Admin API Client
 * All admin operations go through server-side API with admin verification
 * SECURITY: Server verifies admin role before allowing any operations
 */

import { apiRequest } from '../api';

// ============ Types ============

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  day_number: number;
  start_at: string;
  end_at: string;
  is_locked: boolean;
  quiz_type: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "text_input";
  options: string[] | null;
  correct_answer: string;
  points: number;
  order_index: number;
}

export interface Tournament {
  id: string;
  title: string;
  description: string | null;
  tournament_prize_gel: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  tournament_starts_at: string | null;
  tournament_ends_at: string | null;
  quiz_type: string;
  results_released: boolean;
}

// ============ Quiz API ============

export const adminQuizApi = {
  getAll: () => apiRequest<{ quizzes: Quiz[] }>(`/api/admin/quizzes`),

  create: (quiz: {
    title: string;
    description?: string;
    day_number: number;
    start_at: string;
    end_at: string;
    is_locked: boolean;
  }) => apiRequest<{ quiz: Quiz }>(`/api/admin/quizzes`, {
    method: "POST",
    body: JSON.stringify(quiz),
  }),

  update: (id: string, quiz: {
    title: string;
    description?: string;
    day_number: number;
    start_at: string;
    end_at: string;
    is_locked: boolean;
  }) => apiRequest<{ quiz: Quiz }>(`/api/admin/quizzes/${id}`, {
    method: "PUT",
    body: JSON.stringify(quiz),
  }),

  delete: (id: string) => apiRequest<{ success: boolean }>(`/api/admin/quizzes/${id}`, {
    method: "DELETE",
  }),

  toggleLock: (id: string, is_locked: boolean) => apiRequest<{ quiz: Quiz }>(`/api/admin/quizzes/${id}/lock`, {
    method: "PATCH",
    body: JSON.stringify({ is_locked }),
  }),
};

// ============ Question API ============

export const adminQuestionApi = {
  getByQuiz: (quizId: string) => apiRequest<{ questions: Question[] }>(`/api/admin/questions/${quizId}`),

  create: (question: {
    quiz_id: string;
    question_text: string;
    question_type: "multiple_choice" | "text_input";
    options?: string[] | null;
    correct_answer: string;
    points: number;
    order_index: number;
  }) => apiRequest<{ question: Question }>(`/api/admin/questions`, {
    method: "POST",
    body: JSON.stringify(question),
  }),

  update: (id: string, question: {
    question_text: string;
    question_type: "multiple_choice" | "text_input";
    options?: string[] | null;
    correct_answer: string;
    points: number;
    order_index: number;
  }) => apiRequest<{ question: Question }>(`/api/admin/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(question),
  }),

  delete: (id: string) => apiRequest<{ success: boolean }>(`/api/admin/questions/${id}`, {
    method: "DELETE",
  }),
};

// ============ Tournament API ============

export const adminTournamentApi = {
  getAll: () => apiRequest<{ tournaments: Tournament[] }>(`/api/admin/tournaments`),

  create: (tournament: {
    title: string;
    description?: string;
    day_number: number;
    tournament_prize_gel?: number;
    registration_opens_at?: string;
    registration_closes_at?: string;
    tournament_starts_at: string;
    tournament_ends_at: string;
  }) => apiRequest<{ tournament: Tournament }>(`/api/admin/tournaments`, {
    method: "POST",
    body: JSON.stringify(tournament),
  }),

  update: (id: string, tournament: {
    title: string;
    description?: string;
    day_number: number;
    tournament_prize_gel?: number;
    registration_opens_at?: string;
    registration_closes_at?: string;
    tournament_starts_at: string;
    tournament_ends_at: string;
  }) => apiRequest<{ tournament: Tournament }>(`/api/admin/tournaments/${id}`, {
    method: "PUT",
    body: JSON.stringify(tournament),
  }),

  delete: (id: string) => apiRequest<{ success: boolean }>(`/api/admin/tournaments/${id}`, {
    method: "DELETE",
  }),

  toggleResultsReleased: (id: string, results_released: boolean) =>
    apiRequest<{ tournament: Tournament }>(`/api/admin/tournaments/${id}/results-released`, {
      method: "PATCH",
      body: JSON.stringify({ results_released }),
    }),
};

