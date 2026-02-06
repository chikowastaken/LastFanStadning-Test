import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PointsDisplay from "@/components/PointsDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, CheckCircle, Archive, Trophy, X, Gift, ArrowRight } from "lucide-react";
import quizApi from "@/lib/api/quiz";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load tab components for better initial load performance
const TodaysQuizTab = lazy(() => import("@/components/quiz-tabs/TodaysQuizTab"));
const CompletedTab = lazy(() => import("@/components/quiz-tabs/CompletedTab"));
const ArchiveTab = lazy(() => import("@/components/quiz-tabs/ArchiveTab"));
const TournamentsTab = lazy(() => import("@/components/quiz-tabs/TournamentsTab"));

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  day_number: number;
  is_locked: boolean;
  start_at: string;
  end_at: string;
  state?: "NOT_STARTED" | "LIVE" | "LATE" | "EXPIRED"; // Server-calculated state
  hasSubmitted?: boolean; // Server-calculated
}

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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, number>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  // Tournament data
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentRegistrations, setTournamentRegistrations] = useState<Set<string>>(new Set());
  const [tournamentSubmissions, setTournamentSubmissions] = useState<Map<string, number>>(new Map());
  const [activeTournamentSubmissions, setActiveTournamentSubmissions] = useState<Set<string>>(new Set());

  // Derive active tab from URL (single source of truth)
  const activeTab = searchParams.get("tab") || "today";

  // Update URL when tab changes - single render
  const handleTabChange = useCallback((value: string) => {
    setSearchParams({ tab: value });
  }, [setSearchParams]);

  useEffect(() => {
    // Don't redirect if we're still processing OAuth callback (tokens in URL hash)
    const hasAuthTokens = window.location.hash.includes('access_token') ||
      window.location.hash.includes('refresh_token');

    if (!authLoading && !user && !hasAuthTokens) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel: quizzes, profile, and tournaments
      const [quizListRes, profileRes, tournamentsRes, tournamentRegistrationsRes, tournamentSubmissionsRes, activeTournamentSubmissionsRes] = await Promise.all([
        quizApi.getList(),
        supabase.from("profiles").select("total_points").eq("id", user.id).single(),
        supabase
          .from("quizzes")
          .select("id, title, description, tournament_prize_gel, registration_opens_at, registration_closes_at, tournament_starts_at, tournament_ends_at, day_number, start_at")
          .eq("quiz_type", "tournament")
          .order("tournament_starts_at", { ascending: false }),
        supabase
          .from("tournament_registrations")
          .select("quiz_id")
          .eq("user_id", user.id),
        supabase
          .from("tournament_submissions")
          .select("quiz_id, total_score")
          .eq("user_id", user.id)
          .not("submitted_at", "is", null),
        supabase
          .from("tournament_submissions")
          .select("quiz_id")
          .eq("user_id", user.id)
          .not("started_at", "is", null)
          .is("submitted_at", null),
      ]);

      if (quizListRes.quizzes) {
        setQuizzes(quizListRes.quizzes);
        // Build submissions map from quiz list data (which includes submission info)
        const subMap: Record<string, number> = {};
        quizListRes.quizzes.forEach((quiz) => {
          if (quiz.hasSubmitted && quiz.submission) {
            subMap[quiz.id] = quiz.submission.total_score;
          }
        });
        setSubmissions(subMap);
      }
      if (profileRes.data) setTotalPoints(profileRes.data.total_points);

      // Set tournament data
      if (tournamentsRes.data) {
        setTournaments(tournamentsRes.data as Tournament[]);
      }
      if (tournamentRegistrationsRes.data) {
        setTournamentRegistrations(new Set(tournamentRegistrationsRes.data.map(r => r.quiz_id)));
      }
      if (tournamentSubmissionsRes.data) {
        const subMap = new Map<string, number>();
        tournamentSubmissionsRes.data.forEach(s => subMap.set(s.quiz_id, s.total_score));
        setTournamentSubmissions(subMap);
      }
      if (activeTournamentSubmissionsRes.data) {
        setActiveTournamentSubmissions(new Set(activeTournamentSubmissionsRes.data.map(s => s.quiz_id)));
      } else {
        setActiveTournamentSubmissions(new Set());
      }
    } catch (error: unknown) {
      console.error("Error fetching dashboard data:", error);
      const errorMessage = error instanceof Error ? error.message : "უცნობი შეცდომა";

      // Fallback to direct Supabase query if API fails
      try {
        const [quizzesRes, submissionsRes, profileRes, tournamentsRes, tournamentRegistrationsRes, tournamentSubmissionsRes, activeTournamentSubmissionsRes] = await Promise.all([
          supabase
            .from("quizzes")
            .select("*")
            .eq("quiz_type", "daily")
            .order("day_number", { ascending: false }),
          supabase.from("quiz_submissions").select("quiz_id, total_score").eq("user_id", user.id),
          supabase.from("profiles").select("total_points").eq("id", user.id).single(),
          supabase
            .from("quizzes")
            .select("id, title, description, tournament_prize_gel, registration_opens_at, registration_closes_at, tournament_starts_at, tournament_ends_at, day_number, start_at")
            .eq("quiz_type", "tournament")
            .order("tournament_starts_at", { ascending: false }),
          supabase
            .from("tournament_registrations")
            .select("quiz_id")
            .eq("user_id", user.id),
          supabase
            .from("tournament_submissions")
            .select("quiz_id, total_score")
            .eq("user_id", user.id)
            .not("submitted_at", "is", null),
          supabase
            .from("tournament_submissions")
            .select("quiz_id")
            .eq("user_id", user.id)
            .not("started_at", "is", null)
            .is("submitted_at", null),
        ]);

        if (quizzesRes.error) {
          console.error("Fallback quiz fetch error:", quizzesRes.error);
        } else if (quizzesRes.data) {
          setQuizzes(quizzesRes.data);
        }

        if (submissionsRes.error) {
          console.error("Fallback submissions fetch error:", submissionsRes.error);
        } else if (submissionsRes.data) {
          const subMap: Record<string, number> = {};
          submissionsRes.data.forEach((s) => { subMap[s.quiz_id] = s.total_score; });
          setSubmissions(subMap);
        }

        if (profileRes.error) {
          console.error("Fallback profile fetch error:", profileRes.error);
        } else if (profileRes.data) {
          setTotalPoints(profileRes.data.total_points);
        }

        // Handle tournament fallback data
        if (tournamentsRes.data) {
          setTournaments(tournamentsRes.data as Tournament[]);
        }
        if (tournamentRegistrationsRes.data) {
          setTournamentRegistrations(new Set(tournamentRegistrationsRes.data.map(r => r.quiz_id)));
        }
        if (tournamentSubmissionsRes.data) {
          const subMap = new Map<string, number>();
          tournamentSubmissionsRes.data.forEach(s => subMap.set(s.quiz_id, s.total_score));
          setTournamentSubmissions(subMap);
        }
        if (activeTournamentSubmissionsRes.data) {
          setActiveTournamentSubmissions(new Set(activeTournamentSubmissionsRes.data.map(s => s.quiz_id)));
        } else {
          setActiveTournamentSubmissions(new Set());
        }
      } catch (fallbackError) {
        console.error("Fallback fetch also failed:", fallbackError);
        // At this point, we've tried both methods - user will see empty state
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Use server-calculated state instead of client-side time validation
  const { liveQuiz, upcomingQuiz } = useMemo(() => {
    // Find live quiz using server-calculated state (prevents client-side time manipulation)
    const live = quizzes.find((quiz) => {
      return quiz.state === "LIVE" && !quiz.is_locked;
    });

    // Find upcoming quiz using server-calculated state
    const upcoming = quizzes
      .filter((quiz) => quiz.state === "NOT_STARTED" && !quiz.is_locked)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];

    return { liveQuiz: live || null, upcomingQuiz: upcoming || null };
  }, [quizzes]);

  const completedCount = useMemo(() =>
    Object.keys(submissions).length,
    [submissions]
  );

  const archivedCount = useMemo(() =>
    quizzes.filter((quiz) => quiz.state === "LATE" && !quiz.hasSubmitted).length,
    [quizzes]
  );

  // Check if there are any active tournaments or open registrations
  const hasActiveTournaments = useMemo(() => {
    const now = Date.now();
    return tournaments.some((tournament) => {
      if (!tournament.registration_opens_at || !tournament.registration_closes_at ||
        !tournament.tournament_starts_at || !tournament.tournament_ends_at) {
        return false;
      }

      const regOpensTime = new Date(tournament.registration_opens_at).getTime();
      const regClosesTime = new Date(tournament.registration_closes_at).getTime();
      const tourneyStartsTime = new Date(tournament.tournament_starts_at).getTime();
      const tourneyEndsTime = new Date(tournament.tournament_ends_at).getTime();

      // Check if registration is open or tournament is active
      const isRegOpen = now >= regOpensTime && now < regClosesTime;
      const isTourneyActive = now >= tourneyStartsTime && now < tourneyEndsTime;

      return isRegOpen || isTourneyActive;
    });
  }, [tournaments]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="LastFanStanding - ითამაშე ჩცდ-ს ქვიზები და გამოსცადე შენი ცოდნა"
        description="შემოუერთდი LFS-ს, უპასუხე ყოველდღიურად 10 ახალ კითხვას 21:00 საათზე. დააგროვე ქულები, შეეჯიბრე მეგობრებს და მოხვდი ლიდერბორდში. მიიღე მონაწილეობა გრანდ ტურნირში და იბრძოლე 10,000 ლარიანი საპრიზო ფონდისთვის"
        keywords="ქვიზები, ჩემი ცოლის დაქალები, ჩცდ, LastFanStanding, LFS, ყოველდღიური ქვიზი, ჩემი ცოლის დაქალების ქვიზი, ჩცდ ქვიზები, ჩცდ ქვიზი, გრადნტურნირი"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Points Card */}
        <Card variant="gradient" className="mb-8">
          <CardContent className="py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  კეთილი იყოს დაბრუნება!
                </h1>
                <p className="text-muted-foreground">მზად ხართ ამ კვირის გამოწვევისთვის?</p>
              </div>
              <PointsDisplay points={totalPoints} size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5 }}
              className="relative rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-500/15 via-amber-400/10 to-yellow-500/5 shadow-[0_0_25px_rgba(250,204,21,0.15)] overflow-hidden mb-8"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
              </div>

              <button
                onClick={() => setShowBanner(false)}
                className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  {/* Trophy icon */}
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-amber-500/20 border border-yellow-400/30 flex items-center justify-center">
                    <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-display font-bold text-base sm:text-lg text-yellow-300">
                      🎉 უფასო ტურნირი ამ შაბათს 21:00-ზე!
                    </h3>

                    {/* Prize badge */}
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/25 to-amber-500/20 border border-yellow-400/40 rounded-full px-4 py-1.5">
                      <Gift className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold text-yellow-300">
                        🏆 5 x 100₾ City Mall ვაუჩერი
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      რეგისტრაცია სრულიად უფასოა! დარეგისტრირდი ახლავე და მოიგე პრიზები!
                    </p>
                  </div>

                  {/* CTA */}
                  <Link to="/dashboard?tab=tournaments" className="flex-shrink-0 w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base gap-2 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                      რეგისტრაცია
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs Navigation - Same design as Profile page */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Button
              variant={activeTab === "today" ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleTabChange("today")}
              className="w-full gap-2 justify-start"
            >
              <Calendar className="w-4 h-4" />
              დღევანდელი
            </Button>
            <Button
              variant={activeTab === "tournaments" ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleTabChange("tournaments")}
              className="w-full gap-2 justify-start relative"
            >
              <Trophy className="w-4 h-4" />
              ტურნირები
              {tournaments.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-xs rounded-full bg-yellow-400/20 text-yellow-600">
                  {tournaments.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "completed" ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleTabChange("completed")}
              className="w-full gap-2 justify-start"
            >
              <CheckCircle className="w-4 h-4" />
              დასრულებული
              {completedCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-xs rounded-full bg-success/20 text-success">
                  {completedCount}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "archive" ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleTabChange("archive")}
              className="w-full gap-2 justify-start"
            >
              <Archive className="w-4 h-4" />
              არქივი
              {archivedCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-xs rounded-full bg-muted-foreground/20">
                  {archivedCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs Content - Only render active tab to reduce DOM size */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          {activeTab === "today" && (
            <TodaysQuizTab
              liveQuiz={liveQuiz}
              upcomingQuiz={upcomingQuiz}
              hasSubmitted={liveQuiz ? liveQuiz.id in submissions : false}
              onQuizEnd={fetchData}
              fromTab="today"
            />
          )}

          {activeTab === "tournaments" && (
            <TournamentsTab
              tournaments={tournaments}
              registrations={tournamentRegistrations}
              submissions={tournamentSubmissions}
              activeSubmissions={activeTournamentSubmissions}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "completed" && (
            <CompletedTab quizzes={quizzes} submissions={submissions} fromTab="completed" />
          )}

          {activeTab === "archive" && (
            <ArchiveTab quizzes={quizzes} submissions={submissions} fromTab="archive" />
          )}
        </Suspense>
      </div>
    </Layout>
  );
}
