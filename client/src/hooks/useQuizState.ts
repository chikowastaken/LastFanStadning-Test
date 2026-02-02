import { useMemo } from "react";

export type QuizState = "LIVE" | "EXPIRED_NOT_PLAYED" | "EXPIRED_PLAYED";

interface UseQuizStateParams {
  startAt: string;
  endAt: string;
  hasSubmitted: boolean;
}

export function useQuizState({ startAt, endAt, hasSubmitted }: UseQuizStateParams): QuizState {
  return useMemo(() => {
    const now = new Date();
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (hasSubmitted) {
      return "EXPIRED_PLAYED";
    }

    if (now >= start && now <= end) {
      return "LIVE";
    }

    return "EXPIRED_NOT_PLAYED";
  }, [startAt, endAt, hasSubmitted]);
}

export function getPointsPerQuestion(state: QuizState): number {
  switch (state) {
    case "LIVE":
      return 10;
    case "EXPIRED_NOT_PLAYED":
      return 5;
    case "EXPIRED_PLAYED":
      return 0;
  }
}

export function getPointsLabel(state: QuizState): string {
  switch (state) {
    case "LIVE":
      return "10 ქულა";
    case "EXPIRED_NOT_PLAYED":
      return "5 ქულა";
    case "EXPIRED_PLAYED":
      return "0 ქულა (სათამაშოდ)";
  }
}
