/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  AlertCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import quizApi, {
  QuizInfo,
  QuizQuestion,
  QuizQuestionsResponse,
  SubmitQuizResponse,
} from "@/lib/api/quiz";
import { sanitizeAnswers } from "@/lib/sanitize";

// ============ Types ============

type QuizState = "NOT_STARTED" | "LIVE" | "LATE" | "EXPIRED";

interface PracticeResult {
  question_id: string;
  question_text: string;
  answer: string;
  correct_answer: string;
  is_correct: boolean;
}

// ============ Helper Functions ============

function getPointsLabel(state: QuizState, isPractice: boolean): string {
  if (isPractice) return "0 ქულა (პრაქტიკა)";

  switch (state) {
    case "LIVE":
      return "10 ქულა";
    case "LATE":
      return "5 ქულა";
    default:
      return "0 ქულა";
  }
}

function getStateBadge(state: QuizState, isPractice: boolean) {
  if (isPractice) {
    return (
      <Badge variant="outline" className="bg-muted">
        <RotateCcw className="w-3 h-3 mr-1" />
        პრაქტიკა
      </Badge>
    );
  }

  switch (state) {
    case "LIVE":
      return <Badge className="bg-success text-success-foreground">ლაივ</Badge>;
    case "LATE":
      return <Badge variant="secondary">დაგვიანებული (5 ქულა)</Badge>;
    case "EXPIRED":
      return <Badge variant="outline">ვადაგასული</Badge>;
    default:
      return <Badge variant="outline">მალე</Badge>;
  }
}

// ============ Main Component ============

export default function Quiz() {
  const { id: quizId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isPracticeMode = searchParams.get("practice") === "true";
  const fromTab = searchParams.get("fromTab") || "today";

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quiz data (from backend)
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [questionsData, setQuestionsData] = useState<QuizQuestionsResponse | null>(null);

  // User input
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Practice results
  const [practiceResults, setPracticeResults] = useState<{
    score: number;
    total: number;
    results: PracticeResult[];
  } | null>(null);

  // Derived state
  const questions = questionsData?.questions || [];
  const quiz = questionsData?.quiz || quizInfo?.quiz;
  const state = questionsData?.state || quizInfo?.state || "NOT_STARTED";
  const pointsPerCorrect = questionsData?.pointsPerCorrect || quizInfo?.pointsPerCorrect || 0;

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const pointsLabel = getPointsLabel(state, isPracticeMode);

  // ============ API Calls ============

  /**
   * Load quiz info first to check access
   */
  const loadQuizInfo = useCallback(async () => {
    if (!quizId) return;

    try {
      const info = await quizApi.getInfo(quizId);
      setQuizInfo(info);

      // Check if user has already submitted (redirect to results)
      if (info.hasSubmitted && !isPracticeMode) {
        navigate(`/quiz/${quizId}/results?fromTab=${fromTab}`);
        return;
      }

      // Check if user can play
      if (!isPracticeMode && !info.canPlay) {
        if (info.state === "NOT_STARTED") {
          toast({
            variant: "destructive",
            title: "ქვიზი ჯერ არ დაწყებულა",
            description: "გთხოვთ დაელოდოთ დაწყების დროს",
          });
          navigate(`/dashboard?tab=${fromTab}`);
          return;
        }

        if (info.state === "EXPIRED" && !info.hasSubmitted) {
          toast({
            variant: "destructive",
            title: "ვადა ამოიწურა",
            description: "ამ ქვიზის შესრულების დრო გავიდა",
          });
          navigate(`/dashboard?tab=${fromTab}`);
          return;
        }
      }

      // Check practice mode access
      if (isPracticeMode && !info.canPractice) {
        toast({
          variant: "destructive",
          title: "პრაქტიკა მიუწვდომელია",
          description: "პრაქტიკის რეჟიმი ხელმისაწვდომია მხოლოდ ქვიზის შესრულების შემდეგ",
        });
        navigate(`/quiz/${quizId}`);
        return;
      }

      // Load questions
      await loadQuestions();
    } catch (error: unknown) {
      console.error("Error loading quiz info:", error);
      const errorMessage = error instanceof Error ? error.message : "ქვიზის ჩატვირთვა ვერ მოხერხდა";

      // Handle specific error cases
      if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("ვერ მოიძებნა")) {
        toast({
          variant: "destructive",
          title: "ქვიზი ვერ მოიძებნა",
          description: "მოთხოვნილი ქვიზი არ არსებობს",
        });
      } else if (errorMessage.includes("ALREADY_SUBMITTED") || errorMessage.includes("უკვე")) {
        // Already handled by redirect in loadQuizInfo
        return;
      } else {
        toast({
          variant: "destructive",
          title: "შეცდომა",
          description: errorMessage,
        });
      }
      navigate(`/dashboard?tab=${fromTab}`);
    }
  }, [quizId, isPracticeMode, fromTab, navigate, toast]);

  /**
   * Load questions (and start quiz if not practice mode)
   */
  const loadQuestions = useCallback(async () => {
    if (!quizId) return;

    try {
      // Start quiz first (if not practice mode)
      if (!isPracticeMode) {
        await quizApi.start(quizId);
      }

      // Load questions
      const data = await quizApi.getQuestions(quizId, isPracticeMode);
      setQuestionsData(data);
    } catch (error: unknown) {
      console.error("Error loading questions:", error);
      const errorMessage = error instanceof Error ? error.message : "კითხვების ჩატვირთვა ვერ მოხერხდა";

      // Handle specific error codes
      if (errorMessage.includes("ALREADY_SUBMITTED") || errorMessage.includes("უკვე")) {
        navigate(`/quiz/${quizId}/results?fromTab=${fromTab}`);
        return;
      } else if (errorMessage.includes("NOT_STARTED") || errorMessage.includes("არ დაწყებულა")) {
        toast({
          variant: "destructive",
          title: "ქვიზი ჯერ არ დაწყებულა",
          description: errorMessage,
        });
        navigate(`/dashboard?tab=${fromTab}`);
      } else if (errorMessage.includes("EXPIRED") || errorMessage.includes("ვადა")) {
        toast({
          variant: "destructive",
          title: "ვადა ამოიწურა",
          description: errorMessage,
        });
        navigate(`/dashboard?tab=${fromTab}`);
      } else {
        toast({
          variant: "destructive",
          title: "შეცდომა",
          description: errorMessage,
        });
      }
    } finally {
      setInitialLoading(false);
    }
  }, [quizId, isPracticeMode, fromTab, navigate, toast]);

  // ============ Effects ============

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadQuizInfo();
  }, [user, loadQuizInfo, navigate]);

  // ============ Handlers ============

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    // Sanitize input as user types (for UX, server also validates)
    const sanitized = value.length > 1000 ? value.substring(0, 1000) : value;
    setAnswers((prev) => ({ ...prev, [questionId]: sanitized }));
  }, []);

  const handleNext = useCallback(() => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [isLastQuestion]);

  const handleBack = useCallback(() => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [isFirstQuestion]);

  const handleQuestionDotClick = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  /**
   * Submit quiz - graded SERVER-SIDE for security
   */
  const handleSubmit = useCallback(async () => {
    // Validate all questions answered
    const unansweredCount = questions.filter((q) => !answers[q.id]?.trim()).length;
    if (unansweredCount > 0) {
      toast({
        variant: "destructive",
        title: "შეუვსებელი კითხვები",
        description: `გთხოვთ უპასუხოთ ყველა კითხვას (${unansweredCount} შეუვსებელი)`,
      });
      return;
    }

    setSubmitting(true);

    try {
      // Practice mode - grade locally (answers already available)
      if (isPracticeMode) {
        const results: PracticeResult[] = questions.map((q) => ({
          question_id: q.id,
          question_text: q.question_text,
          answer: answers[q.id] || "",
          correct_answer: q.correct_answer || "",
          is_correct:
            (answers[q.id] || "").trim().toLowerCase() ===
            (q.correct_answer || "").trim().toLowerCase(),
        }));

        const correctCount = results.filter((r) => r.is_correct).length;

        setPracticeResults({
          score: correctCount,
          total: questions.length,
          results,
        });

        toast({
          title: "პრაქტიკა დასრულდა!",
          description: `სწორი პასუხები: ${correctCount}/${questions.length}`,
        });
        return;
      }

      // Real submission - send to backend for secure grading
      // Sanitize answers before sending
      const sanitizedAnswers = sanitizeAnswers(answers);
      const result = await quizApi.submit(quizId!, sanitizedAnswers);

      const message = result.isLate
        ? `თქვენ მოაგროვეთ ${result.score} ქულა (დაგვიანებული)`
        : `თქვენ მოაგროვეთ ${result.score} ქულა!`;

      toast({
        title: "ქვიზი გაგზავნილია!",
        description: message,
      });

      // Navigate to results
      navigate(`/quiz/${quizId}/results?fromTab=${fromTab}`);
    } catch (error: unknown) {
      console.error("Submit error:", error);
      const errorMessage = error instanceof Error ? error.message : "გთხოვთ სცადოთ თავიდან";

      // Handle specific error codes
      if (errorMessage.includes("Too many requests")) {
        toast({
          variant: "destructive",
          title: "ძალიან ბევრი მცდელობა",
          description: "თქვენ ძალიან ბევრი მცდელობა გქონდათ. გთხოვთ დაელოდოთ რამდენიმე წუთს და სცადოთ ხელახლა.",
          duration: 10000, // Show for 10 seconds
        });
      } else if (errorMessage.includes("MISSING_ANSWERS")) {
        toast({
          variant: "destructive",
          title: "შეუვსებელი კითხვები",
          description: errorMessage,
        });
      } else if (errorMessage.includes("ALREADY_SUBMITTED")) {
        toast({
          variant: "destructive",
          title: "უკვე გაგზავნილია",
          description: "თქვენ უკვე შეასრულეთ ეს ქვიზი",
        });
        navigate(`/quiz/${quizId}/results?fromTab=${fromTab}`);
      } else if (errorMessage.includes("EXPIRED") || errorMessage.includes("ვადა")) {
        toast({
          variant: "destructive",
          title: "ვადა ამოიწურა",
          description: errorMessage,
        });
        navigate(`/dashboard?tab=${fromTab}`);
      } else {
        toast({
          variant: "destructive",
          title: "გაგზავნა ვერ მოხერხდა",
          description: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, isPracticeMode, quizId, fromTab, navigate, toast]);

  // ============ Render Helpers ============

  // Loading state
  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">ქვიზი იტვირთება...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state - no quiz
  if (!quiz) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">ქვიზი ვერ მოიძებნა</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`/dashboard?tab=${fromTab}`)}
          >
            დაბრუნება
          </Button>
        </div>
      </Layout>
    );
  }

  // Practice results screen
  if (practiceResults) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <Card variant="elevated" className="mb-6">
            <CardHeader className="text-center">
              <Badge variant="outline" className="w-fit mx-auto mb-2">
                <RotateCcw className="w-3 h-3 mr-1" />
                პრაქტიკა
              </Badge>
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Trophy className="w-8 h-8 text-primary" />
                <span className="text-4xl font-display font-bold text-primary">
                  {practiceResults.score}/{practiceResults.total}
                </span>
              </div>
              <p className="text-muted-foreground mt-2">სწორი პასუხები</p>
              <p className="text-sm text-warning mt-1">ქულები არ ჩაითვალა</p>
            </CardHeader>
          </Card>

          {/* Results list */}
          <div className="space-y-4">
            {practiceResults.results.map((r, i) => (
              <Card
                key={r.question_id}
                variant="default"
                className={`border-l-4 ${r.is_correct ? "border-l-success" : "border-l-destructive"
                  }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {r.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="text-sm text-muted-foreground">კითხვა {i + 1}</span>
                  </div>
                  <CardTitle className="text-lg mt-2">{r.question_text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div
                    className={`p-3 rounded-lg ${r.is_correct
                      ? "bg-success/10 border border-success/20"
                      : "bg-destructive/10 border border-destructive/20"
                      }`}
                  >
                    <p className="text-sm text-muted-foreground">თქვენი პასუხი:</p>
                    <p className="font-medium">{r.answer || "—"}</p>
                  </div>
                  {!r.is_correct && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-sm text-muted-foreground">სწორი პასუხი:</p>
                      <p className="font-medium text-success">{r.correct_answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/dashboard?tab=${fromTab}`)}
            >
              მთავარ გვერდზე
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => navigate(`/quiz/${quizId}/results?fromTab=${fromTab}`)}
            >
              ნამდვილი შედეგები
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Main quiz UI
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{quiz.title}</CardTitle>
              {getStateBadge(state, isPracticeMode)}
            </div>
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4" />
              <span>თითოეული სწორი პასუხი: {pointsLabel}</span>
            </div>
            {isPracticeMode && (
              <p className="text-sm text-warning mt-2">
                პრაქტიკის რეჟიმი — ქულები არ ჩაითვლება
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">პროგრესი</span>
            <span className="font-medium">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
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
              <p className="text-sm text-accent">{pointsLabel}</p>
            </CardHeader>
            <CardContent>
              {currentQuestion.question_type === "multiple_choice" &&
                currentQuestion.options ? (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                >
                  {(currentQuestion.options as string[]).map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 p-3 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <RadioGroupItem value={opt} id={`${currentQuestion.id}-${idx}`} />
                      <Label
                        htmlFor={`${currentQuestion.id}-${idx}`}
                        className="flex-1 cursor-pointer"
                      >
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Input
                  placeholder="ჩაწერეთ თქვენი პასუხი..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  autoComplete="off"
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
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-1" />
              )}
              {isPracticeMode ? "დასრულება" : "გაგზავნა"}
            </Button>
          ) : (
            <Button variant="default" className="flex-1" onClick={handleNext}>
              შემდეგი
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question dots indicator */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => handleQuestionDotClick(idx)}
              className={`w-3 h-3 rounded-full transition-colors ${idx === currentQuestionIndex
                ? "bg-primary"
                : answers[q.id]?.trim()
                  ? "bg-accent"
                  : "bg-muted"
                }`}
              aria-label={`კითხვა ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}