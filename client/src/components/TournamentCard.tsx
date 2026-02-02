import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/CountdownTimer";
import { Trophy, Clock, Users, Lock, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Tournament {
    id: string;
    title: string;
    description: string | null;
    tournament_prize_gel: number | null;
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    tournament_starts_at: string | null;
    tournament_ends_at: string | null;
    start_at?: string;
    day_number?: number;
}

type TournamentStatus =
    | "REGISTRATION_NOT_OPEN"
    | "REGISTRATION_OPEN"
    | "REGISTRATION_CLOSED"
    | "TOURNAMENT_ACTIVE"
    | "TOURNAMENT_ENDED";

interface TournamentCardProps {
    tournament: Tournament;
    status: TournamentStatus;
    isRegistered: boolean;
    hasSubmitted: boolean;
    hasActiveSubmission?: boolean; // User has started but not submitted
    score?: number;
    onRegister: (id: string) => void;
    onRefresh: () => void;
    registering: string | null;
}

const TournamentCard = memo(function TournamentCard({
    tournament,
    status,
    isRegistered,
    hasSubmitted,
    hasActiveSubmission = false,
    score,
    onRegister,
    onRefresh,
    registering,
}: TournamentCardProps) {
    const navigate = useNavigate();

    // Get status badge info
    const getStatusBadge = () => {
        if (hasSubmitted) return { label: "დასრულებული", color: "bg-success text-success-foreground" };
        if (status === "TOURNAMENT_ACTIVE" && isRegistered) return { label: "აქტიური", color: "bg-warning text-warning-foreground" };
        if (status === "REGISTRATION_OPEN" && isRegistered) return { label: "დარეგისტრირებული", color: "bg-primary text-primary-foreground" };
        if (status === "REGISTRATION_CLOSED" && isRegistered) return { label: "დარეგისტრირებული", color: "bg-muted text-muted-foreground" };
        if (status === "REGISTRATION_OPEN") return { label: "ლაივ", color: "bg-primary text-primary-foreground" };
        if (status === "REGISTRATION_CLOSED") return { label: "რეგისტრაცია დახურულია", color: "bg-muted text-muted-foreground" };
        if (status === "TOURNAMENT_ENDED") return { label: "დასრულებული", color: "bg-muted text-muted-foreground" };
        return { label: "მომავალი", color: "bg-secondary text-secondary-foreground" };
    };

    const statusBadge = getStatusBadge();

    // Format date for display
    const getDateDisplay = () => {
        if (tournament.tournament_starts_at) {
            try {
                return format(new Date(tournament.tournament_starts_at), "dd MMM yyyy");
            } catch {
                return null;
            }
        }
        return null;
    };

    const dateDisplay = getDateDisplay();

    return (
        <Card
            variant="elevated"
            className="relative overflow-hidden transition-all hover:scale-[1.02]"
        >
            {/* Status badge - top right (desktop only) */}
            <div className="absolute top-4 right-4 z-10 hidden md:block">
                <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
            </div>

            <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    {dateDisplay ? dateDisplay : tournament.day_number ? `დღე ${tournament.day_number}` : "ტურნირი"}
                    {/* Status badge - inline (mobile only) */}
                    <Badge className={`${statusBadge.color} md:hidden`}>{statusBadge.label}</Badge>
                    {tournament.tournament_prize_gel && (
                        <>
                            <span className="mx-1">•</span>
                            <Trophy className="w-4 h-4 text-accent" />
                            <span className="text-accent font-semibold whitespace-nowrap">{tournament.tournament_prize_gel} ₾</span>
                        </>
                    )}
                </div>
                <CardTitle className="text-xl">{tournament.title}</CardTitle>
                {tournament.description && (
                    <CardDescription>{tournament.description}</CardDescription>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Score display - similar to quiz cards */}
                {hasSubmitted && score !== undefined && (
                    <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                            <p className="text-sm text-muted-foreground">მიღებული ქულა</p>
                            <p className="text-2xl font-display font-bold text-success">{score} ქულა</p>
                        </div>
                    </div>
                )}

                {/* Registration Not Open */}
                {status === "REGISTRATION_NOT_OPEN" && tournament.registration_opens_at && (
                    <div className="bg-secondary/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2 text-center">რეგისტრაცია იწყება:</p>
                        <CountdownTimer
                            targetDate={new Date(tournament.registration_opens_at)}
                            onComplete={onRefresh}
                        />
                    </div>
                )}

                {/* Registration Open */}
                {status === "REGISTRATION_OPEN" && tournament.registration_closes_at && (
                    <div className="space-y-3">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm text-primary mb-2 text-center font-medium">რეგისტრაცია იხურება:</p>
                            <CountdownTimer
                                targetDate={new Date(tournament.registration_closes_at)}
                                onComplete={onRefresh}
                            />
                        </div>

                        {!isRegistered ? (
                            <Button
                                variant="hero"
                                size="lg"
                                className="w-full"
                                onClick={() => onRegister(tournament.id)}
                                disabled={registering === tournament.id}
                            >
                                {registering === tournament.id ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        რეგისტრაცია...
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-5 h-5 mr-2" />
                                        რეგისტრაცია
                                    </>
                                )}
                            </Button>
                        ) : (
                            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-success/10 border border-success/20">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <span className="text-success font-medium">თქვენ უკვე დარეგისტრირებული ხართ</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Registration Closed */}
                {status === "REGISTRATION_CLOSED" && tournament.tournament_starts_at && (
                    <div className="space-y-3">
                        <div className="bg-secondary/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-2 text-center">ტურნირი იწყება:</p>
                            <CountdownTimer
                                targetDate={new Date(tournament.tournament_starts_at)}
                                onComplete={onRefresh}
                            />
                        </div>

                        {!isRegistered && (
                            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted">
                                <Lock className="w-5 h-5 text-muted-foreground" />
                                <p className="text-muted-foreground">რეგისტრაცია დახურულია</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tournament Active */}
                {status === "TOURNAMENT_ACTIVE" && (
                    <div className="space-y-3">
                        {tournament.tournament_ends_at && (
                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                                <p className="text-sm text-warning mb-2 text-center font-medium">ტურნირი მთავრდება:</p>
                                <CountdownTimer
                                    targetDate={new Date(tournament.tournament_ends_at)}
                                    onComplete={onRefresh}
                                />
                            </div>
                        )}

                        {isRegistered ? (
                            hasSubmitted ? (
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate(`/tournament/${tournament.id}/results`)}
                                >
                                    შედეგების ნახვა
                                </Button>
                            ) : hasActiveSubmission ? (
                                <Button
                                    variant="hero"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                                >
                                    <ArrowRight className="w-5 h-5 mr-2" />
                                    ტურნირის გაგრძელება
                                </Button>
                            ) : (
                                <Button
                                    variant="hero"
                                    size="lg"
                                    className="w-full"
                                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                                >
                                    <Trophy className="w-5 h-5 mr-2" />
                                    ტურნირში შესვლა
                                </Button>
                            )
                        ) : (
                            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted">
                                <Lock className="w-5 h-5 text-muted-foreground" />
                                <p className="text-muted-foreground">რეგისტრაცია საჭიროა</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Tournament Ended */}
                {status === "TOURNAMENT_ENDED" && (
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        onClick={() => navigate(`/tournament/${tournament.id}/results`)}
                    >
                        შედეგების ნახვა
                    </Button>
                )}
            </CardContent>
        </Card>
    );
});

export default TournamentCard;