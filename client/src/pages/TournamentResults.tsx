import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Medal, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { tournamentApi } from "@/lib/api";
import confetti from "canvas-confetti";

interface LeaderboardEntry {
  user_id: string;
  total_score: number;
  submitted_at: string;
  rank: number;
  username?: string;
  avatar_url?: string;
}

interface TournamentQuiz {
  id: string;
  title: string;
  tournament_prize_gel: number | null;
  tournament_starts_at?: string;
}

interface QuestionResult {
  id: string;
  question_text: string;
  order_index: number;
  user_answer: string;
  correct_answer?: string;
  points?: number;
  is_correct?: boolean;
  points_earned?: number;
}

export default function TournamentResults() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<TournamentQuiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [activeTab, setActiveTab] = useState("my-answers");
  const [resultsReleased, setResultsReleased] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;

    if (!user) { navigate("/"); return; }

    // Use a flag to prevent state updates after unmount
    let isMounted = true;

    const loadResults = async () => {
      if (!id || !user) return;

      try {
        const results = await tournamentApi.getResults(id);

        // Only update state if component is still mounted
        if (!isMounted) return;

        setQuiz(results.quiz);
        setQuestions(results.questions);
        setResultsReleased(results.resultsReleased);
        setDurationSeconds(results.durationSeconds);

        // If results are released, fetch leaderboard with profiles
        if (results.resultsReleased && results.leaderboard) {
          // Get all user IDs (top 50 + potentially current user)
          const userIds = results.leaderboard.map((e) => e.user_id);

          // Add current user's ID if they have a rank outside top 50
          if (results.userRank && !userIds.includes(results.userRank.user_id)) {
            userIds.push(results.userRank.user_id);
          }

          // Fetch profiles only if there are user IDs
          let profileMap = new Map();
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .in("id", userIds);

            // Check if still mounted after async operation
            if (!isMounted) return;

            profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          }

          const enrichedLeaderboard = results.leaderboard.map((entry) => ({
            ...entry,
            username: profileMap.get(entry.user_id)?.username || "მოთამაშე",
            avatar_url: profileMap.get(entry.user_id)?.avatar_url,
          }));

          if (!isMounted) return;

          setLeaderboard(enrichedLeaderboard);
          setActiveTab("leaderboard");

          // Set user's rank (could be from leaderboard or separate userRank)
          if (results.userRank) {
            const userRankEntry: LeaderboardEntry = {
              ...results.userRank,
              username: profileMap.get(results.userRank.user_id)?.username || "მოთამაშე",
              avatar_url: profileMap.get(results.userRank.user_id)?.avatar_url,
            };
            setUserRank(userRankEntry);

            // Fire confetti for top 5 users
            if (results.userRank.rank <= 5) {
              setTimeout(() => {
                if (isMounted) {
                  confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#4169E1'],
                  });
                }
              }, 500);
            }
          }
        }
      } catch (error: unknown) {
        if (!isMounted) return;

        const errorMessage = error instanceof Error ? error.message : "უცნობი შეცდომა";
        if (errorMessage.includes("NOT_SUBMITTED")) {
          toast({
            variant: "destructive",
            title: "შედეგები ვერ მოიძებნა",
            description: "თქვენ ჯერ არ შეასრულეთ ეს ტურნირი"
          });
          navigate(`/tournament/${id}`);
        } else {
          toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadResults();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user, authLoading, navigate, id, toast]);

  // Format duration from seconds
  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{rank}</span>;
    }
  };

  // Calculate score from server-calculated is_correct flags (only when results released)
  const calculateScore = () => {
    let correct = 0;
    let incorrect = 0;
    questions.forEach(q => {
      if (q.is_correct) {
        correct++;
      } else {
        incorrect++;
      }
    });
    return { correct, incorrect, total: questions.length };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const scoreBreakdown = resultsReleased ? calculateScore() : null;

  // Check if user is outside top 50
  const userOutsideTop50 = userRank && userRank.rank > 50;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <Card variant="elevated" className="mb-6 border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
          <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-transparent pt-8 pb-6 px-6">
            <div className="flex flex-col items-center text-center">
              {/* Glowing Trophy */}
              <div className="relative mb-4">
                <div className="absolute inset-0 blur-2xl bg-amber-400/30 rounded-full scale-150" />
                <Trophy className="w-20 h-20 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] relative z-10" />
              </div>

              {/* Title */}
              <CardTitle className="text-xl font-display font-bold mb-2">{quiz?.title}</CardTitle>
              <p className="text-sm text-muted-foreground mb-4">
                {resultsReleased ? "ტურნირის შედეგები" : "ტურნირი დასრულებულია"}
              </p>

              {/* Fancy Prize Display with Shimmer */}
              {quiz?.tournament_prize_gel && (
                <div className="relative overflow-hidden bg-amber-500/10 border border-amber-400/40 rounded-xl px-6 py-3">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" style={{ backgroundSize: '200% 100%' }} />
                  <p className="text-xs text-amber-300/80 font-medium uppercase tracking-wider mb-1 relative z-10">პრიზი</p>
                  <p className="text-2xl font-display font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] relative z-10">
                    {Math.floor(quiz.tournament_prize_gel / 100)} x 100₾ ვაუჩერი
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ========== RESULTS NOT RELEASED ========== */}
        {!resultsReleased && (
          <>
            {/* Completion time card */}
            <Card variant="default" className="mb-6">
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">დასრულების დრო</p>
                <p className="text-3xl font-display font-bold text-primary">
                  {formatDuration(durationSeconds)}
                </p>
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-muted-foreground">
                    შედეგები მალე გამოქვეყნდება
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* My Answers - without correct/incorrect indicators */}
            <Card variant="default">
              <CardHeader>
                <CardTitle className="text-lg">ჩემი პასუხები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    კითხვები არ მოიძებნა
                  </p>
                ) : (
                  questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-lg bg-secondary/50"
                    >
                      <p className="font-medium mb-2">
                        {index + 1}. {q.question_text}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">თქვენი პასუხი: </span>
                        <span className="font-medium">
                          {q.user_answer || "(პასუხი არ გაცემულა)"}
                        </span>
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ========== RESULTS RELEASED ========== */}
        {resultsReleased && (
          <>
            {/* User's result summary */}
            {userRank && (
              <Card variant="default" className="mb-6 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRankIcon(Number(userRank.rank))}
                      <div>
                        <p className="font-medium">თქვენი შედეგი</p>
                        <p className="text-sm text-muted-foreground">
                          #{userRank.rank} ადგილი
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-primary">
                        {userRank.total_score} ქულა
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(durationSeconds)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for leaderboard and my answers */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="leaderboard">ლიდერბორდი</TabsTrigger>
                <TabsTrigger value="my-answers">ჩემი პასუხები</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard">
                {leaderboard.length === 0 ? (
                  <Card variant="default">
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground py-8">
                        ჯერ არავის არ დაუსრულებია ტურნირი
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {/* Top 5 Winners - Individual Cards */}
                    {leaderboard.filter(e => e.rank <= 5).map((entry) => {
                      const isCurrentUser = entry.user_id === user?.id;

                      // Calculate duration from tournament start (with validation to prevent epoch fallback)
                      const submittedTime = new Date(entry.submitted_at).getTime();
                      const tournamentStart = quiz?.tournament_starts_at ? new Date(quiz.tournament_starts_at).getTime() : null;
                      const displayDuration = tournamentStart !== null
                        ? Math.max(0, Math.floor((submittedTime - tournamentStart) / 1000))
                        : null;

                      return (
                        <div
                          key={entry.user_id}
                          className={`relative rounded-xl border p-4 transition-all duration-200 bg-gradient-to-r from-yellow-500/15 via-amber-400/10 to-yellow-500/5 border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.25)] ${isCurrentUser ? 'ring-2 ring-primary/40' : ''
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10">
                                <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" />
                              </div>
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="font-bold text-base block">
                                    {entry.username} 🏆
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    #{entry.rank} ადგილი
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-lg text-primary">
                                  {entry.total_score}
                                </span>
                                <span className="text-xs text-primary/70">ქულა</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs">
                                  {displayDuration !== null ? formatDuration(displayDuration) : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Remaining participants - compact list (ranks 6-50) */}
                    {leaderboard.filter(e => e.rank > 5 && e.rank <= 50).length > 0 && (
                      <Card variant="default" className="mt-2">
                        <CardContent className="pt-4 space-y-1.5">
                          {leaderboard.filter(e => e.rank > 5 && e.rank <= 50).map((entry) => {
                            const isCurrentUser = entry.user_id === user?.id;

                            // Calculate duration from tournament start (with validation to prevent epoch fallback)
                            const submittedTime = new Date(entry.submitted_at).getTime();
                            const tournamentStart = quiz?.tournament_starts_at ? new Date(quiz.tournament_starts_at).getTime() : null;
                            const displayDuration = tournamentStart !== null
                              ? Math.max(0, Math.floor((submittedTime - tournamentStart) / 1000))
                              : null;

                            return (
                              <div
                                key={entry.user_id}
                                className={`flex items-center justify-between rounded-lg p-3 transition-all duration-200 ${isCurrentUser
                                  ? 'bg-primary/15 border border-primary/30'
                                  : 'bg-secondary/50'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 flex items-center justify-center text-sm font-medium text-muted-foreground">
                                    {entry.rank}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {entry.avatar_url ? (
                                      <img src={entry.avatar_url} alt={entry.username} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="font-medium text-sm">{entry.username}</span>
                                    {isCurrentUser && (
                                      <Badge variant="outline" className="text-xs">თქვენ</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold">{entry.total_score}</span>
                                    <span className="text-[10px] text-muted-foreground">ქულა</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px]">
                                      {displayDuration !== null ? formatDuration(displayDuration) : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {/* Show user's position if outside top 50 */}
                    {userOutsideTop50 && userRank && (
                      <>
                        <div className="text-center text-muted-foreground py-2 text-sm">
                          • • •
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center text-sm font-medium">
                              {userRank.rank}
                            </span>
                            <div className="flex items-center gap-2">
                              {userRank.avatar_url ? (
                                <img
                                  src={userRank.avatar_url}
                                  alt={userRank.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <span className="font-medium">{userRank.username}</span>
                              <Badge variant="outline" className="text-xs">თქვენ</Badge>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold">{userRank.total_score}</span>
                              <span className="text-[10px] text-muted-foreground">ქულა</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px]">{formatDuration(durationSeconds)}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-answers">
                <Card variant="default">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">ჩემი პასუხები</CardTitle>
                      {scoreBreakdown && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle className="w-4 h-4" />
                            {scoreBreakdown.correct}
                          </span>
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="w-4 h-4" />
                            {scoreBreakdown.incorrect}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {questions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        კითხვები არ მოიძებნა
                      </p>
                    ) : (
                      questions.map((q, index) => {
                        const isCorrect = q.is_correct;

                        return (
                          <div
                            key={q.id}
                            className={`p-4 rounded-lg border ${isCorrect
                              ? 'bg-success/10 border-success/30'
                              : 'bg-destructive/10 border-destructive/30'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-destructive" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium mb-2">
                                  {index + 1}. {q.question_text}
                                </p>
                                <div className="text-sm space-y-1">
                                  <p>
                                    <span className="text-muted-foreground">თქვენი პასუხი: </span>
                                    <span className={isCorrect ? 'text-success font-medium' : 'text-destructive font-medium'}>
                                      {q.user_answer || "(პასუხი არ გაცემულა)"}
                                    </span>
                                  </p>
                                  {!isCorrect && q.correct_answer && (
                                    <p>
                                      <span className="text-muted-foreground">სწორი პასუხი: </span>
                                      <span className="text-success font-medium">{q.correct_answer}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge variant={isCorrect ? "default" : "destructive"} className="shrink-0">
                                {q.points_earned && q.points_earned > 0 ? `+${q.points_earned}` : "0"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => navigate("/dashboard?tab=tournaments")}
        >
          მთავარ გვერდზე
        </Button>
      </div>
    </Layout>
  );
}
