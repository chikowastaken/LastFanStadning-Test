import { useMemo } from "react";

export type TournamentState = 
  | "NOT_STARTED"      // Before tournament_starts_at
  | "ACTIVE"           // Between tournament_starts_at and tournament_ends_at
  | "ENDED"            // After tournament_ends_at
  | "ALREADY_SUBMITTED"; // User has already submitted

interface UseTournamentStateParams {
  tournamentStartsAt: string | null;
  tournamentEndsAt: string | null;
  hasSubmitted: boolean;
}

export function useTournamentState({ 
  tournamentStartsAt, 
  tournamentEndsAt, 
  hasSubmitted 
}: UseTournamentStateParams): TournamentState {
  return useMemo(() => {
    if (hasSubmitted) {
      return "ALREADY_SUBMITTED";
    }

    if (!tournamentStartsAt || !tournamentEndsAt) {
      return "NOT_STARTED";
    }

    const now = new Date();
    const start = new Date(tournamentStartsAt);
    const end = new Date(tournamentEndsAt);

    if (now < start) {
      return "NOT_STARTED";
    }

    if (now > end) {
      return "ENDED";
    }

    return "ACTIVE";
  }, [tournamentStartsAt, tournamentEndsAt, hasSubmitted]);
}

export function getTournamentStatusLabel(state: TournamentState): string {
  switch (state) {
    case "NOT_STARTED":
      return "ტურნირი ჯერ არ დაწყებულა";
    case "ACTIVE":
      return "ტურნირი აქტიურია";
    case "ENDED":
      return "ტურნირი დასრულდა";
    case "ALREADY_SUBMITTED":
      return "თქვენ უკვე მონაწილეობა მიიღეთ";
  }
}
