import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, AlertCircle, Clock, ChevronLeft, ChevronRight, Trophy, Timer, Lock } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { tournamentApi } from "@/lib/api";
import { sanitizeAnswers } from "@/lib/sanitize";

interface TournamentQuiz {
  id: string;
  title: string;
  description: string | null;
  tournament_starts_at: string | null;
  tournament_ends_at: string | null;
  tournament_prize_gel: number | null;
  quiz_type: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  points: number;
  order_index: number;
  // NOTE: correct_answer is NOT included - fetched server-side only for security
}

interface TournamentSubmission {
  id: string;
  started_at: string;
  submitted_at: string | null;
  total_score: number;
  duration_seconds: number | null;
}

export default function TournamentQuiz() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<TournamentQuiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submission, setSubmission] = useState<TournamentSubmission | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [tournamentState, setTournamentState] = useState<{
    state: 'NOT_STARTED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ACTIVE' | 'ENDED' | 'ALREADY_SUBMITTED';
    isRegistered: boolean;
    hasSubmitted: boolean;
  } | null>(null);
  
  const submittingRef = useRef(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Auto-save answers (debounced, every 2 seconds after user stops typing)
  useEffect(() => {
    // Only auto-save if:
    // 1. Attempt has started
    // 2. Submission exists and is not submitted
    // 3. There are answers to save
    if (!attemptStarted || !submission || submission.submitted_at || Object.keys(answers).length === 0) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!id || !user) return;
      
      setIsSaving(true);
      try {
        await tournamentApi.saveAnswers(id, answers);
        // Silently save - don't show toast to avoid annoying user
      } catch (error: unknown) {
        // Silently fail - don't interrupt user experience
        // Answers will be saved on final submit anyway
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 second debounce

    // Cleanup timeout on unmount or when answers change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [answers, attemptStarted, submission, id, user]);

  const fetchTournamentData = useCallback(async () => {
    if (!user || !id) return;
    
    try {
      // Check registration first
      const registrationRes = await supabase
        .from("tournament_registrations")
        .select("id")
        .eq("quiz_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsRegistered(!!registrationRes.data);

      // Get basic quiz info (for display before starting)
      const quizRes = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .eq("quiz_type", "tournament")
        .single();

      if (quizRes.error || !quizRes.data) {
        toast({ variant: "destructive", title: "ტურნირი ვერ მოიძებნა" });
        navigate("/dashboard");
        return;
      }

      setQuiz(quizRes.data as TournamentQuiz);

      // Fetch server-calculated tournament state (prevents client-side time manipulation)
      try {
        const stateData = await tournamentApi.getState(id);
        setTournamentState({
          state: stateData.state,
          isRegistered: stateData.isRegistered,
          hasSubmitted: stateData.hasSubmitted,
        });
        setIsRegistered(stateData.isRegistered);
      } catch (error: unknown) {
        console.error("Error fetching tournament state:", error);
        // Fallback - will be handled by server when trying to start
      }

      // Check if user has an active submission
      const submissionRes = await supabase
        .from("tournament_submissions")
        .select("*")
        .eq("quiz_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setSubmission(submissionRes.data as TournamentSubmission | null);

      // If submission exists but not submitted, fetch questions via API (secure - no correct_answer)
      if (submissionRes.data && !submissionRes.data.submitted_at) {
        try {
          const questionsData = await tournamentApi.getQuestions(id);
          setQuestions(questionsData.questions as Question[]);
          
          // Restore saved answers if they exist (resume functionality)
          if (questionsData.savedAnswers && Object.keys(questionsData.savedAnswers).length > 0) {
            setAnswers(questionsData.savedAnswers);
          }

          setAttemptStarted(true);
        } catch (error: unknown) {
          // If API fails (e.g., tournament ended), show error
          const errorMessage = error instanceof Error ? error.message : "კითხვების ჩატვირთვა ვერ მოხერხდა";
          toast({ 
            variant: "destructive", 
            title: "შეცდომა", 
            description: errorMessage
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "უცნობი შეცდომა";
      toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, toast]);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    
    // Only redirect if auth is loaded and user is null
    if (!user) {
      navigate("/");
      return;
    }
    
    fetchTournamentData();
  }, [user, authLoading, navigate, fetchTournamentData]);

  const startAttempt = async () => {
    if (!user || !id || starting) return;
    
    setStarting(true);
    try {
      // Use API to start tournament (creates submission record)
      const startResult = await tournamentApi.start(id);
      
      setSubmission(startResult.submission as TournamentSubmission);
      
      // Fetch questions via API (secure - no correct_answer exposed)
      const questionsData = await tournamentApi.getQuestions(id);
      setQuestions(questionsData.questions as Question[]);
      
      // Restore saved answers if resuming (should be empty on first start)
      if (questionsData.savedAnswers && Object.keys(questionsData.savedAnswers).length > 0) {
        setAnswers(questionsData.savedAnswers);
      }

      setAttemptStarted(true);
      toast({ title: "ტურნირი დაიწყო!", description: "წარმატებას გისურვებთ!" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "ტურნირის დაწყება ვერ მოხერხდა";
      console.error("Error starting tournament:", error);
      
      // Handle specific error cases
      if (errorMessage.includes("not registered") || errorMessage.includes("არ ხართ")) {
        toast({ 
          variant: "destructive", 
          title: "რეგისტრაცია საჭიროა", 
          description: "თქვენ არ ხართ დარეგისტრირებული ამ ტურნირზე" 
        });
        navigate("/dashboard");
      } else if (errorMessage.includes("ended") || errorMessage.includes("დასრულდა")) {
        toast({ 
          variant: "destructive", 
          title: "ტურნირი დასრულდა", 
          description: errorMessage 
        });
        navigate(`/tournament/${id}/results`);
      } else if (errorMessage.includes("not started") || errorMessage.includes("არ დაწყებულა")) {
        toast({ 
          variant: "destructive", 
          title: "ტურნირი ჯერ არ დაწყებულა", 
          description: errorMessage 
        });
        // Refresh tournament state
        fetchTournamentData();
      } else {
        toast({ variant: "destructive", title: "შეცდომა", description: errorMessage });
      }
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submittingRef.current || !submission || !id || !user) return;
    
    // Note: Unanswered questions are allowed (will be marked as incorrect on server)
    // Only validate on manual submit (not auto-submit)
    if (!isAutoSubmit) {
      const unansweredCount = questions.filter((q) => !answers[q.id]?.trim()).length;
      if (unansweredCount > 0) {
        const proceed = confirm(
          `თქვენ არ უპასუხეთ ${unansweredCount} კითხვას. შეუვსებელი კითხვები ჩაითვლება არასწორად. გსურთ გაგზავნა?`
        );
        if (!proceed) {
          return;
        }
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    
    // Cancel any pending auto-save before submitting
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    try {
      // Sanitize answers before sending
      const sanitizedAnswers = sanitizeAnswers(answers);

      // Use secure API endpoint - server calculates score, no correct_answer exposed
      await tournamentApi.submit(id, sanitizedAnswers);

      // Don't show score in toast - results are hidden until admin releases them
      const message = isAutoSubmit
        ? "დრო ამოიწურა! თქვენი პასუხები გაიგზავნა"
        : "თქვენი პასუხები წარმატებით გაიგზავნა!";

      toast({ title: isAutoSubmit ? "ავტომატური გაგზავნა" : "ტურნირი გაგზავნილია!", description: message });
      navigate(`/tournament/${id}/results`);
    } catch (error: unknown) {
      // Handle specific error codes
      const errorMessage = error instanceof Error ? error.message : "გთხოვთ სცადოთ თავიდან";
      
      if (errorMessage.includes("MISSING_ANSWERS")) {
        toast({
          variant: "destructive",
          title: "შეუვსებელი კითხვები",
          description: errorMessage,
        });
      } else if (errorMessage.includes("Already submitted") || errorMessage.includes("უკვე")) {
        toast({
          variant: "destructive",
          title: "უკვე გაგზავნილია",
          description: "თქვენ უკვე შეასრულეთ ეს ტურნირი",
        });
        navigate(`/tournament/${id}/results`);
      } else if (errorMessage.includes("ended") || errorMessage.includes("დასრულდა")) {
        toast({
          variant: "destructive",
          title: "ტურნირი დასრულდა",
          description: errorMessage,
        });
        navigate(`/tournament/${id}/results`);
      } else if (errorMessage.includes("not registered") || errorMessage.includes("არ ხართ")) {
        toast({
          variant: "destructive",
          title: "რეგისტრაცია საჭიროა",
          description: errorMessage,
        });
        navigate("/dashboard");
      } else {
        toast({ variant: "destructive", title: "გაგზავნა ვერ მოხერხდა", description: errorMessage });
      }
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [submission, questions, answers, navigate, toast, id, user]);

  const handleTimeUp = useCallback(() => {
    // Auto-submit when tournament ends (if user has unsubmitted attempt)
    if (!submittingRef.current && submission && !submission.submitted_at) {
      // Cancel any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      handleSubmit(true);
    }
  }, [handleSubmit, submission]);

  // Check if tournament has ended and auto-submit if needed
  useEffect(() => {
    if (!quiz?.tournament_ends_at || !submission || submission.submitted_at) return;
    if (!attemptStarted) return;

    const checkTournamentEnd = () => {
      const now = new Date();
      const endsAt = new Date(quiz.tournament_ends_at!);
      
      // If tournament has ended and user hasn't submitted, auto-submit
      if (now >= endsAt && !submittingRef.current) {
        // Cancel any pending auto-save
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        handleSubmit(true);
      }
    };

    // Check immediately
    checkTournamentEnd();

    // Check every 5 seconds to catch tournament end
    const interval = setInterval(checkTournamentEnd, 5000);

    return () => clearInterval(interval);
  }, [quiz?.tournament_ends_at, submission, attemptStarted, handleSubmit]);

  const handleNext = () => {
    // Move to next question freely without any restrictions
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    // Move to previous question freely without any restrictions
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionDotClick = (index: number) => {
    // Jump to any question freely without restrictions
    setCurrentQuestionIndex(index);
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

  if (!quiz) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p>ტურნირი ვერ მოიძებნა</p>
        </div>
      </Layout>
    );
  }

  // Not registered
  if (!isRegistered) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card variant="elevated">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 text-warning mx-auto mb-4" />
              <CardTitle>რეგისტრაცია საჭიროა</CardTitle>
              <p className="text-muted-foreground mt-2">
                ამ ტურნირში მონაწილეობისთვის რეგისტრაცია აუცილებელია
              </p>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                მთავარ გვერდზე
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Tournament not started yet (using server-calculated state)
  if (tournamentState?.state === "NOT_STARTED" || tournamentState?.state === "REGISTRATION_OPEN" || tournamentState?.state === "REGISTRATION_CLOSED") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card variant="elevated">
            <CardHeader className="text-center">
              <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>{quiz.title}</CardTitle>
              {quiz.tournament_prize_gel && (
                <Badge variant="secondary" className="mt-2">
                  პრიზი: {quiz.tournament_prize_gel} ₾
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">ტურნირი დაიწყება:</p>
                <CountdownTimer 
                  targetDate={new Date(quiz.tournament_starts_at)} 
                  onComplete={() => window.location.reload()}
                />
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                მთავარ გვერდზე
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Tournament ended (using server-calculated state)
  if (tournamentState?.state === "ENDED") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card variant="elevated">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>ტურნირი დასრულდა</CardTitle>
              <p className="text-muted-foreground mt-2">
                სამწუხაროდ, ეს ტურნირი უკვე დასრულებულია
              </p>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                მთავარ გვერდზე
              </Button>
              <Button variant="default" className="flex-1" onClick={() => navigate(`/tournament/${id}/results`)}>
                შედეგები
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Already submitted - show results link (using server-calculated state)
  if (tournamentState?.state === "ALREADY_SUBMITTED") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card variant="elevated">
            <CardHeader className="text-center">
              <Trophy className="w-12 h-12 text-success mx-auto mb-4" />
              <CardTitle>თქვენ უკვე მონაწილეობა მიიღეთ</CardTitle>
              {submission && (
                <div className="mt-4">
                  <p className="text-4xl font-display font-bold text-primary">
                    {submission.total_score} ქულა
                  </p>
                  {submission.duration_seconds && (
                    <p className="text-sm text-muted-foreground mt-2">
                      დრო: {Math.floor(submission.duration_seconds / 60)}:{(submission.duration_seconds % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
                მთავარ გვერდზე
              </Button>
              <Button variant="default" className="flex-1" onClick={() => navigate(`/tournament/${id}/results`)}>
                ლიდერბორდი
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Tournament is ACTIVE - show start screen or quiz
  if (!attemptStarted) {
    // Calculate prize vouchers (divide by 100)
    const prizeVouchers = quiz.tournament_prize_gel ? Math.floor(quiz.tournament_prize_gel / 100) : 0;
    // Get points per question (use first question's points or default to 10)
    const pointsPerQuestion = questions.length > 0 ? questions[0].points : 10;

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card
            variant="elevated"
            className="relative overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          >
            {/* Hero section with trophy and prize - matching TournamentCard */}
            <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-transparent pt-8 pb-6 px-6">
              <div className="flex flex-col items-center text-center">
                {/* Glowing Trophy */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 blur-2xl bg-amber-400/30 rounded-full scale-150" />
                  <Trophy className="w-20 h-20 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] relative z-10" />
                </div>

                {/* Title and Description */}
                <CardTitle className="text-xl font-display font-bold mb-2">{quiz.title}</CardTitle>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground mb-4">{quiz.description}</p>
                )}

                {/* Fancy Prize Display with Shimmer */}
                {quiz.tournament_prize_gel && (
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

            <CardContent className="space-y-6 pt-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Timer className="w-5 h-5" />
                  <span className="font-medium">მნიშვნელოვანი!</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• მხოლოდ ერთი მცდელობა გაქვთ</li>
                  <li>• თითო სწორი პასუხი: {pointsPerQuestion} ქულა</li>
                  <li>• კითხვები: {questions.length}</li>
                </ul>
              </div>

              {quiz.tournament_ends_at && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">ტურნირი დასრულდება:</p>
                  <CountdownTimer targetDate={new Date(quiz.tournament_ends_at)} />
                </div>
              )}

              <Button variant="hero" className="w-full" onClick={startAttempt} disabled={starting}>
                {starting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    იტვირთება...
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-2" />
                    ტურნირის დაწყება
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Active quiz attempt
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Timer Header */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <Badge className="bg-primary text-primary-foreground mt-2">
                  <Trophy className="w-3 h-3 mr-1" />
                  ტურნირი
                </Badge>
              </div>
              {quiz.tournament_ends_at && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    {isSaving && (
                      <span className="text-xs text-muted-foreground">ინახება...</span>
                    )}
                    {!isSaving && Object.keys(answers).length > 0 && (
                      <span className="text-xs text-success">✓ შენახული</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">დარჩენილი დრო:</p>
                  <CountdownTimer 
                    targetDate={new Date(quiz.tournament_ends_at)} 
                    onComplete={handleTimeUp}
                  />
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">პროგრესი</span>
            <span className="font-medium">{currentQuestionIndex + 1} / {questions.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <Card variant="default" className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                კითხვა {currentQuestionIndex + 1}. {currentQuestion.question_text}
              </CardTitle>
              <p className="text-sm text-accent">10 ქულა</p>
            </CardHeader>
            <CardContent>
              {currentQuestion.question_type === "multiple_choice" && currentQuestion.options ? (
                <RadioGroup 
                  value={answers[currentQuestion.id] || ""} 
                  onValueChange={(v) => setAnswers({ ...answers, [currentQuestion.id]: v })}
                >
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                      <RadioGroupItem value={opt} id={`${currentQuestion.id}-${idx}`} />
                      <Label htmlFor={`${currentQuestion.id}-${idx}`} className="flex-1 cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Input 
                  placeholder="ჩაწერეთ თქვენი პასუხი..." 
                  value={answers[currentQuestion.id] || ""} 
                  onChange={(e) => {
                    // Sanitize input as user types (for UX, server also validates)
                    const sanitized = e.target.value.length > 1000 ? e.target.value.substring(0, 1000) : e.target.value;
                    setAnswers({ ...answers, [currentQuestion.id]: sanitized });
                  }}
                  maxLength={1000}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleBack}
            disabled={isFirstQuestion}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            უკან
          </Button>

          {isLastQuestion ? (
            <Button 
              variant="hero" 
              className="flex-1" 
              onClick={() => handleSubmit(false)} 
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-1" />}
              გაგზავნა
            </Button>
          ) : (
            <Button
              variant="default"
              className="flex-1"
              onClick={handleNext}
            >
              შემდეგი
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            const hasAnswer = answers[q.id] && answers[q.id].trim().length > 0;

            return (
              <button
                key={q.id}
                onClick={() => handleQuestionDotClick(idx)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  isCurrent
                    ? 'bg-primary cursor-default'
                    : hasAnswer
                      ? 'bg-accent cursor-pointer'
                      : 'bg-muted cursor-pointer'
                }`}
                aria-label={`კითხვა ${idx + 1}`}
                title={`კითხვა ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
