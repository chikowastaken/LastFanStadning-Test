import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "@/components/CountdownTimer";
import { Trophy, Clock, Users, Lock, CheckCircle, ArrowRight, Loader2, AlertTriangle, Instagram, } from "lucide-react";
import { format } from "date-fns";

// Georgian month names
const GEORGIAN_MONTHS = [
    "იან", "თებ", "მარ", "აპრ", "მაი", "ივნ",
    "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"
];

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

    // Format date for display with Georgian month
    const getDateDisplay = () => {
        if (tournament.tournament_starts_at) {
            try {
                const date = new Date(tournament.tournament_starts_at);
                const day = format(date, "dd");
                const month = GEORGIAN_MONTHS[date.getMonth()];
                const year = format(date, "yyyy");
                return `${day} ${month} ${year}`;
            } catch {
                return null;
            }
        }
        return null;
    };

    const dateDisplay = getDateDisplay();

    // Calculate prize vouchers (divide by 100)
    const prizeVouchers = tournament.tournament_prize_gel ? Math.floor(tournament.tournament_prize_gel / 100) : 0;

    return (
        <Card
            variant="elevated"
            className="relative overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
        >
            {/* Status badge - top right */}
            <div className="absolute top-4 right-4 z-10">
                <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
            </div>

            {/* Date - top left */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-muted-foreground text-sm bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                {dateDisplay ? dateDisplay : tournament.day_number ? `დღე ${tournament.day_number}` : "ტურნირი"}
            </div>

            {/* Hero section with trophy and prize */}
            <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-transparent pt-16 pb-6 px-6">
                <div className="flex flex-col items-center text-center">
                    {/* Glowing Trophy */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 blur-2xl bg-amber-400/30 rounded-full scale-150" />
                        <Trophy className="w-20 h-20 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] relative z-10" />
                    </div>

                    {/* Title and Description */}
                    <CardTitle className="text-xl font-display font-bold mb-2">{tournament.title}</CardTitle>
                    {tournament.description && (
                        <p className="text-sm text-muted-foreground mb-4">{tournament.description}</p>
                    )}

                    {/* Fancy Prize Display with Shimmer */}
                    {tournament.tournament_prize_gel && (
                        <div className="relative overflow-hidden bg-amber-500/10 border border-amber-400/40 rounded-xl px-6 py-3">
                            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" style={{ backgroundSize: '200% 100%' }} />
                            <p className="text-xs text-amber-300/80 font-medium uppercase tracking-wider mb-1 relative z-10">პრიზი</p>
                            <p className="text-2xl font-display font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] relative z-10">
                                {prizeVouchers} x 100₾ ვაუჩერი
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <CardContent className="space-y-4 pt-4">
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

                {/* Instagram follow notice */}
                <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 border border-pink-400/30 rounded-lg p-2.5 sm:p-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning flex-shrink-0 mt-0.5 md:mt-0" />
                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">მნიშვნელოვანი:</span>{" "}
                                გამარჯვებულებს ვაცხადებთ Instagram-ზე. პრიზის მისაღებად აუცილებელია გვერდის გამოწერა!
                            </p>
                        </div>
                        <a
                            href="https://www.instagram.com/lastfanstanding.ge"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white text-[11px] sm:text-xs font-bold hover:opacity-90 transition-opacity shadow-[0_0_10px_rgba(236,72,153,0.3)] flex-shrink-0 w-full sm:w-auto justify-center"
                        >
                            <Instagram className="w-3.5 h-3.5" />
                            <span className="whitespace-nowrap">გამოგვყევი</span>
                        </a>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
});

export default TournamentCard;