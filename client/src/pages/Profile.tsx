import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, Trophy, TrendingUp, Target, Award, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay, parseISO } from "date-fns";

interface ProfileData {
  username: string | null;
  avatar_url: string | null;
  total_points: number;
  weekly_points: number;
  monthly_points?: number;
}

interface DailyPointsData {
  date: string;
  points: number;
  dateLabel: string;
}

interface TournamentHistory {
  id: string;
  title: string;
  submitted_at: string;
  total_score: number;
  rank: number;
  tournament_prize_gel: number | null;
  duration_seconds: number | null;
}

interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  bestScore: number;
  bestScoreDate: string | null;
  averageScore: number;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [dailyPoints, setDailyPoints] = useState<DailyPointsData[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistory[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Username validation
  const validateUsername = (username: string): string | null => {
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 2) return "მომხმარებლის სახელი უნდა იყოს მინიმუმ 2 სიმბოლო";
    if (trimmed.length > 30) return "მომხმარებლის სახელი უნდა იყოს მაქსიმუმ 30 სიმბოლო";
    if (!/^[a-zA-Z0-9ა-ჰ\s\-_]+$/.test(trimmed)) {
      return "მომხმარებლის სახელი შეიძლება შეიცავდეს მხოლოდ ასოებს, ციფრებს, სპეისებს, ჰიფენებსა და ქვედა ხაზებს";
    }
    return null;
  };

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      // Try to fetch the profile
      let profileRes = await supabase
        .from("profiles")
        .select("username, avatar_url, total_points")
        .eq("id", user.id)
        .single();

      // If profile doesn't exist (PGRST116 = 0 rows returned), create it automatically
      if (profileRes.error && profileRes.error.code === 'PGRST116') {
        console.log("Profile not found, creating automatically...");

        // Generate default username from email or user ID
        const defaultUsername = user.email?.split('@')[0] || `User${user.id.substring(0, 8)}`;

        // Create the profile
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username: defaultUsername,
            total_points: 0,
            avatar_url: null,
          });

        if (insertError) {
          console.error("Failed to create profile:", insertError);
          throw new Error("პროფილის შექმნა ვერ მოხერხდა. გთხოვთ, განაახლოთ გვერდი.");
        }

        // Also create user_role if missing
        await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            role: 'user',
          })
          .then(() => console.log("User role created"))
          .catch((err) => console.log("User role already exists or failed:", err));

        // Retry fetching the newly created profile
        profileRes = await supabase
          .from("profiles")
          .select("username, avatar_url, total_points")
          .eq("id", user.id)
          .single();
      }

      // If there's still an error after attempting to create, throw it
      if (profileRes.error) {
        throw profileRes.error;
      }

      // Fetch weekly/monthly points using RPC functions
      const [weeklyRes, monthlyRes] = await Promise.all([
        supabase.rpc("get_weekly_leaderboard"),
        supabase.rpc("get_monthly_leaderboard"),
      ]);

      // Find user's weekly and monthly points from RPC results
      const weeklyPoints = (weeklyRes.data as { user_id: string; weekly_points: number }[] | null)
        ?.find(entry => entry.user_id === user.id)?.weekly_points || 0;

      const monthlyPoints = (monthlyRes.data as { user_id: string; monthly_points: number }[] | null)
        ?.find(entry => entry.user_id === user.id)?.monthly_points || 0;

      if (profileRes.data) {
        // Use email prefix as fallback display if username is null/empty
        const displayUsername = profileRes.data.username || user.email?.split('@')[0] || "User";

        const profileData: ProfileData = {
          username: profileRes.data.username,
          avatar_url: profileRes.data.avatar_url,
          total_points: profileRes.data.total_points,
          weekly_points: weeklyPoints,
          monthly_points: monthlyPoints,
        };
        setProfile(profileData);
        setUsername(displayUsername);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: error instanceof Error ? error.message : "პროფილის ჩატვირთვა ვერ მოხერხდა",
      });
    }
  }, [user, toast]);

  // Fetch daily points for last 30 days
  const fetchDailyPoints = useCallback(async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      // Get quiz submissions with quiz dates
      const { data: submissions, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select("total_score, submitted_at, quiz_id")
        .eq("user_id", user.id)
        .not("submitted_at", "is", null)
        .gte("submitted_at", thirtyDaysAgo)
        .order("submitted_at", { ascending: true });

      if (submissionsError) throw submissionsError;

      if (submissions && submissions.length > 0) {
        // Get quiz dates
        const quizIds = [...new Set(submissions.map(s => s.quiz_id))];
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, start_at")
          .in("id", quizIds);

        const quizDateMap = new Map(quizzes?.map(q => [q.id, q.start_at]) || []);

        // Group points by date
        const pointsByDate = new Map<string, number>();
        submissions.forEach(sub => {
          const date = format(parseISO(sub.submitted_at), "yyyy-MM-dd");
          const current = pointsByDate.get(date) || 0;
          pointsByDate.set(date, current + sub.total_score);
        });

        // Create array for all 30 days
        const days = eachDayOfInterval({
          start: subDays(new Date(), 29),
          end: new Date(),
        });

        const dailyData: DailyPointsData[] = days.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const points = pointsByDate.get(dateStr) || 0;
          return {
            date: dateStr,
            points,
            dateLabel: format(day, "MMM dd"),
          };
        });

        setDailyPoints(dailyData);
      } else {
        // Create empty array for 30 days
        const days = eachDayOfInterval({
          start: subDays(new Date(), 29),
          end: new Date(),
        });
        setDailyPoints(days.map(day => ({
          date: format(day, "yyyy-MM-dd"),
          points: 0,
          dateLabel: format(day, "MMM dd"),
        })));
      }
    } catch (error) {
      console.error("Error fetching daily points:", error);
    }
  }, [user]);

  // Fetch tournament history
  const fetchTournamentHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from("tournament_submissions")
        .select("id, quiz_id, total_score, submitted_at, duration_seconds")
        .eq("user_id", user.id)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });

      if (submissionsError) throw submissionsError;

      if (submissions && submissions.length > 0) {
        const quizIds = [...new Set(submissions.map(s => s.quiz_id))];
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, title, tournament_prize_gel")
          .in("id", quizIds)
          .eq("quiz_type", "tournament");

        const quizMap = new Map(quizzes?.map(q => [q.id, q]) || []);

        // Get ranks for each tournament
        const historyWithRanks: TournamentHistory[] = await Promise.all(
          submissions.map(async (sub) => {
            const quiz = quizMap.get(sub.quiz_id);
            if (!quiz) return null;

            // Get leaderboard to find rank
            const { data: leaderboard } = await supabase.rpc("get_tournament_leaderboard", {
              p_quiz_id: sub.quiz_id,
            });

            const rank = leaderboard?.findIndex((e: { user_id: string }) => e.user_id === user.id) + 1 || 0;

            return {
              id: sub.id,
              title: quiz.title,
              submitted_at: sub.submitted_at,
              total_score: sub.total_score,
              rank,
              tournament_prize_gel: quiz.tournament_prize_gel,
              duration_seconds: sub.duration_seconds,
            };
          })
        );

        setTournamentHistory(historyWithRanks.filter((h): h is TournamentHistory => h !== null));
      }
    } catch (error) {
      console.error("Error fetching tournament history:", error);
    }
  }, [user]);

  // Fetch quiz statistics
  const fetchQuizStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get all quiz submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("quiz_submissions")
        .select("id, quiz_id, total_score, submitted_at")
        .eq("user_id", user.id)
        .not("submitted_at", "is", null);

      if (submissionsError) throw submissionsError;

      if (submissions && submissions.length > 0) {
        // Get all user answers to calculate accuracy
        const submissionIds = submissions.map(s => s.id);
        const { data: answers } = await supabase
          .from("user_answers")
          .select("is_correct")
          .in("submission_id", submissionIds);

        const correctCount = answers?.filter(a => a.is_correct).length || 0;
        const totalAnswers = answers?.length || 0;
        const accuracyRate = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;

        // Get question count per quiz
        const quizIds = [...new Set(submissions.map(s => s.quiz_id))];
        const { data: questions } = await supabase
          .from("questions")
          .select("quiz_id")
          .in("quiz_id", quizIds);

        const totalQuestions = questions?.length || 0;

        // Find best score
        const bestSubmission = submissions.reduce((best, current) => 
          current.total_score > best.total_score ? current : best
        );

        const averageScore = submissions.reduce((sum, s) => sum + s.total_score, 0) / submissions.length;

        setQuizStats({
          totalQuizzes: submissions.length,
          totalQuestions,
          correctAnswers: correctCount,
          accuracyRate: Math.round(accuracyRate * 10) / 10,
          bestScore: bestSubmission.total_score,
          bestScoreDate: bestSubmission.submitted_at,
          averageScore: Math.round(averageScore * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Error fetching quiz stats:", error);
    }
  }, [user]);

  // Save username
  const handleSaveUsername = async () => {
    if (!user) return;

    // Trim username
    const trimmedUsername = username.trim();

    // Check if username hasn't changed
    if (trimmedUsername === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    const validation = validateUsername(trimmedUsername);
    if (validation) {
      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: validation,
      });
      return;
    }

    setIsSavingUsername(true);
    try {
      // Check if username is already taken
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmedUsername)
        .neq("id", user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingProfile) {
        toast({
          variant: "destructive",
          title: "შეცდომა",
          description: "ამ მომხმარებლის სახელი უკვე გამოყენებულია",
        });
        setIsSavingUsername(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ username: trimmedUsername })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === "23505" || error.message.includes("unique") || error.message.includes("duplicate")) {
          toast({
            variant: "destructive",
            title: "შეცდომა",
            description: "ამ მომხმარებლის სახელი უკვე გამოყენებულია",
          });
        } else {
          throw error;
        }
        setIsSavingUsername(false);
        return;
      }

      // Verify the update actually worked
      if (!data || data.username !== trimmedUsername) {
        toast({
          variant: "destructive",
          title: "შეცდომა",
          description: "მომხმარებლის სახელის განახლება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        });
        setIsSavingUsername(false);
        return;
      }

      setProfile(prev => prev ? { ...prev, username: trimmedUsername } : null);
      setUsername(trimmedUsername);
      setIsEditingUsername(false);
      toast({
        title: "წარმატება",
        description: "მომხმარებლის სახელი განახლებულია",
      });
    } catch (error: unknown) {
      console.error("Error updating username:", error);
      let errorMessage = "მომხმარებლის სახელის განახლება ვერ მოხერხდა";
      
      if (error && typeof error === 'object' && 'code' in error) {
        const err = error as { code?: string; message?: string };
        if (err.code === "23505" || err.message?.includes("unique") || err.message?.includes("duplicate")) {
          errorMessage = "ამ მომხმარებლის სახელი უკვე გამოყენებულია";
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "შეცდომა",
        description: errorMessage,
      });
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Load all data
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    if (user) {
      setLoading(true);
      Promise.all([
        fetchProfile(),
        fetchDailyPoints(),
        fetchTournamentHistory(),
        fetchQuizStats(),
      ]).finally(() => setLoading(false));
    }
  }, [user, authLoading, navigate, fetchProfile, fetchDailyPoints, fetchTournamentHistory, fetchQuizStats]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-8rem)]">
          {/* Mobile/Tablet: Two-Row Navigation Grid */}
          <div className="lg:hidden mb-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={activeTab === "profile" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveTab("profile")}
                className="w-full gap-2 justify-start"
              >
                <User className="w-4 h-4" />
                პროფილი
              </Button>
              <Button
                variant={activeTab === "points" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveTab("points")}
                className="w-full gap-2 justify-start"
              >
                <Trophy className="w-4 h-4" />
                ქულები
              </Button>
              <Button
                variant={activeTab === "analytics" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveTab("analytics")}
                className="w-full gap-2 justify-start"
              >
                <TrendingUp className="w-4 h-4" />
                ანალიტიკა
              </Button>
              <Button
                variant={activeTab === "tournaments" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveTab("tournaments")}
                className="w-full gap-2 justify-start"
              >
                <Award className="w-4 h-4" />
                ტურნირები
              </Button>
            </div>
          </div>

          {/* Desktop: Left Sidebar - Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card variant="elevated" className="h-full sticky top-4">
              <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant={activeTab === "profile" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    პროფილი
                  </Button>
                  <Button
                    variant={activeTab === "points" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("points")}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    ქულები
                  </Button>
                  <Button
                    variant={activeTab === "analytics" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("analytics")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    ანალიტიკა
                  </Button>
                  <Button
                    variant={activeTab === "tournaments" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("tournaments")}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    ტურნირები
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Profile Settings Tab */}
              <TabsContent value="profile" className="space-y-6 mt-0">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>პროფილის პარამეტრები</CardTitle>
                    <CardDescription>განაახლეთ თქვენი პროფილის ინფორმაცია</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Username Section */}
                    <div className="space-y-2">
                      <Label htmlFor="username">მომხმარებლის სახელი</Label>
                      {isEditingUsername ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="მომხმარებლის სახელი"
                            maxLength={30}
                            className="flex-1"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveUsername}
                              disabled={isSavingUsername}
                              size="default"
                              className="flex-1 sm:flex-none"
                            >
                              {isSavingUsername ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "შენახვა"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setUsername(profile.username || "");
                                setIsEditingUsername(false);
                              }}
                              disabled={isSavingUsername}
                              size="icon"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            id="username"
                            value={profile.username || ""}
                            placeholder={!profile.username ? (user?.email?.split('@')[0] || "დააყენეთ მომხმარებლის სახელი") : undefined}
                            disabled
                            className="bg-muted flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingUsername(true)}
                            className="w-full sm:w-auto"
                          >
                            რედაქტირება
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        2-30 სიმბოლო. მხოლოდ ასოები, ციფრები, სპეისები, ჰიფენები და ქვედა ხაზები
                      </p>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">ელ. ფოსტა</Label>
                      <Input
                        id="email"
                        value={user.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        ელ. ფოსტა დაკავშირებულია Google ანგარიშთან
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Points Overview Tab */}
              <TabsContent value="points" className="space-y-4 md:space-y-6 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="text-lg">სულ ქულები</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-accent" />
                        <span className="text-3xl font-bold">{profile.total_points.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="text-lg">კვირის ქულები</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-primary" />
                        <span className="text-3xl font-bold">{profile.weekly_points.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle className="text-lg">თვის ქულები</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-success" />
                        <span className="text-3xl font-bold">{(profile.monthly_points || 0).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Best Performance Stats */}
                {quizStats && (
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>საუკეთესო შედეგები</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">საუკეთესო ქულა</p>
                          <p className="text-2xl font-bold">{quizStats.bestScore}</p>
                          {quizStats.bestScoreDate && (
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(quizStats.bestScoreDate), "dd MMM yyyy")}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">საშუალო ქულა</p>
                          <p className="text-2xl font-bold">{quizStats.averageScore}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">სიზუსტე</p>
                          <p className="text-2xl font-bold">{quizStats.accuracyRate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-0">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>ქულების ანალიტიკა (ბოლო 30 დღე)</CardTitle>
                    <CardDescription>ყოველდღიური ქულების გრაფიკი</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 sm:h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyPoints}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval="preserveStartEnd"
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="points"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="ქულები"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Accuracy Rate */}
                {quizStats && (
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>სიზუსტე</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">საერთო სიზუსტე</span>
                          <span className="text-2xl font-bold">{quizStats.accuracyRate}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-primary h-3 rounded-full transition-all"
                            style={{ width: `${quizStats.accuracyRate}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs sm:text-sm">სწორი პასუხები</p>
                            <p className="text-base sm:text-lg font-semibold">{quizStats.correctAnswers}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs sm:text-sm">სულ პასუხები</p>
                            <p className="text-base sm:text-lg font-semibold">{quizStats.totalQuestions}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tournaments Tab */}
              <TabsContent value="tournaments" className="space-y-6 mt-0">
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>ტურნირების ისტორია</CardTitle>
                    <CardDescription>თქვენი მონაწილეობა ტურნირებში</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tournamentHistory.length > 0 ? (
                      <div className="overflow-x-auto -mx-6 px-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px]">ტურნირი</TableHead>
                              <TableHead className="min-w-[120px]">თარიღი</TableHead>
                              <TableHead className="min-w-[60px]">ქულა</TableHead>
                              <TableHead className="min-w-[80px]">ადგილი</TableHead>
                              <TableHead className="min-w-[80px]">ჯილდო</TableHead>
                              <TableHead className="min-w-[70px]">დრო</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tournamentHistory.map((tournament) => (
                              <TableRow key={tournament.id}>
                                <TableCell className="font-medium">{tournament.title}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <span className="hidden sm:inline">
                                    {format(parseISO(tournament.submitted_at), "dd MMM yyyy, HH:mm")}
                                  </span>
                                  <span className="sm:hidden">
                                    {format(parseISO(tournament.submitted_at), "dd/MM/yy")}
                                  </span>
                                </TableCell>
                                <TableCell>{tournament.total_score}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center gap-1">
                                    <Trophy className="w-4 h-4 text-accent" />
                                    #{tournament.rank}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {tournament.tournament_prize_gel ? (
                                    <span className="text-success font-semibold">
                                      {tournament.tournament_prize_gel} ₾
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {tournament.duration_seconds
                                    ? `${Math.floor(tournament.duration_seconds / 60)}:${String(tournament.duration_seconds % 60).padStart(2, "0")}`
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>თქვენ ჯერ არ მონაწილეობთ ტურნირებში</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
