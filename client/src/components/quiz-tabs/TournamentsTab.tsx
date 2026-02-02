import { memo, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TournamentCard from "@/components/TournamentCard";
import { Trophy, Clock } from "lucide-react";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  tournament_prize_gel: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  tournament_starts_at: string | null;
  tournament_ends_at: string | null;
}

type TournamentStatus =
  | "REGISTRATION_NOT_OPEN"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "TOURNAMENT_ACTIVE"
  | "TOURNAMENT_ENDED";

interface TournamentsTabProps {
  tournaments: Tournament[];
  registrations: Set<string>;
  submissions: Map<string, number>;
  activeSubmissions: Set<string>;
  onRefresh: () => Promise<void>;
}

function getTournamentStatus(tournament: Tournament, nowTime: number): TournamentStatus {
  if (!tournament.registration_opens_at || !tournament.registration_closes_at ||
    !tournament.tournament_starts_at || !tournament.tournament_ends_at) {
    return "REGISTRATION_NOT_OPEN";
  }

  const regOpensTime = new Date(tournament.registration_opens_at).getTime();
  const regClosesTime = new Date(tournament.registration_closes_at).getTime();
  const tourneyStartsTime = new Date(tournament.tournament_starts_at).getTime();
  const tourneyEndsTime = new Date(tournament.tournament_ends_at).getTime();

  if (nowTime < regOpensTime) return "REGISTRATION_NOT_OPEN";
  if (nowTime >= regOpensTime && nowTime < regClosesTime) return "REGISTRATION_OPEN";
  if (nowTime >= regClosesTime && nowTime < tourneyStartsTime) return "REGISTRATION_CLOSED";
  if (nowTime >= tourneyStartsTime && nowTime < tourneyEndsTime) return "TOURNAMENT_ACTIVE";
  return "TOURNAMENT_ENDED";
}

const TournamentsTab = memo(function TournamentsTab({ tournaments, registrations, submissions, activeSubmissions, onRefresh }: TournamentsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [registering, setRegistering] = useState<string | null>(null);

  // Memoize current time to avoid creating new Date objects on every render
  const nowTime = useMemo(() => Date.now(), [tournaments]);

  const handleRegister = useCallback(async (tournamentId: string) => {
    if (!user) return;

    setRegistering(tournamentId);
    try {
      const { error } = await supabase
        .from("tournament_registrations")
        .insert({ quiz_id: tournamentId, user_id: user.id });

      if (error) throw error;

      toast({ title: "რეგისტრაცია წარმატებულია!", description: "თქვენ დარეგისტრირდით ტურნირზე" });
      // Refresh tournaments to update state
      await onRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "რეგისტრაცია ვერ მოხერხდა";
      console.error("Error registering for tournament:", error);

      // Handle specific error cases
      if (errorMessage.includes("duplicate") || errorMessage.includes("უკვე")) {
        toast({
          variant: "destructive",
          title: "რეგისტრაცია ვერ მოხერხდა",
          description: "თქვენ უკვე დარეგისტრირდით ამ ტურნირზე"
        });
        // Refresh to get updated state
        await onRefresh();
      } else {
        toast({ variant: "destructive", title: "რეგისტრაცია ვერ მოხერხდა", description: errorMessage });
      }
    } finally {
      setRegistering(null);
    }
  }, [user, toast, onRefresh]);

  const { upcomingTournaments, activeTournaments, pastTournaments } = useMemo(() => {
    const nowTime = Date.now();

    return tournaments.reduce(
      (acc, t) => {
        const status = getTournamentStatus(t, nowTime);
        if (status === "TOURNAMENT_ENDED") {
          acc.pastTournaments.push(t);
        } else if (status === "TOURNAMENT_ACTIVE") {
          acc.activeTournaments.push(t);
        } else {
          acc.upcomingTournaments.push(t);
        }
        return acc;
      },
      {
        upcomingTournaments: [] as Tournament[],
        activeTournaments: [] as Tournament[],
        pastTournaments: [] as Tournament[]
      }
    );
  }, [tournaments]);

  if (tournaments.length === 0) {
    return (
      <Card variant="default">
        <CardContent className="py-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">ტურნირები არ არის</h3>
          <p className="text-muted-foreground">ახალი ტურნირები მალე დაემატება</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            აქტიური ტურნირები
          </h2>
          <div className="grid gap-4">
            {activeTournaments.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                status="TOURNAMENT_ACTIVE"
                isRegistered={registrations.has(t.id)}
                hasSubmitted={submissions.has(t.id)}
                hasActiveSubmission={activeSubmissions.has(t.id)}
                score={submissions.get(t.id)}
                onRegister={handleRegister}
                onRefresh={onRefresh}
                registering={registering}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            მომავალი ტურნირები
          </h2>
          <div className="grid gap-4">
            {upcomingTournaments.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                status={getTournamentStatus(t, nowTime)}
                isRegistered={registrations.has(t.id)}
                hasSubmitted={submissions.has(t.id)}
                hasActiveSubmission={activeSubmissions.has(t.id)}
                score={submissions.get(t.id)}
                onRegister={handleRegister}
                onRefresh={onRefresh}
                registering={registering}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Tournaments */}
      {pastTournaments.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-muted-foreground" />
            დასრულებული ტურნირები
          </h2>
          <div className="grid gap-4">
            {pastTournaments.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                status="TOURNAMENT_ENDED"
                isRegistered={registrations.has(t.id)}
                hasSubmitted={submissions.has(t.id)}
                score={submissions.get(t.id)}
                onRegister={handleRegister}
                onRefresh={onRefresh}
                registering={registering}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default TournamentsTab;