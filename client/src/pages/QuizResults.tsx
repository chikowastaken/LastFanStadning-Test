/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  Clock,
  RotateCcw,
} from "lucide-react";
import quizApi, { QuizResultsResponse } from "@/lib/api/quiz";

// ============ Helper Functions ============

/**
 * Format duration in seconds to readable string
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) return `${secs} წამი`;
  return `${mins} წუთი ${secs} წამი`;
}

/**
 * Format submission time to DD.MM.YYYY, HH:MM format in Georgia timezone
 */
function formatSubmissionTime(utcIso: string | null): string {
  if (!utcIso) return "—";

  const dt = new Date(utcIso);
  // Convert UTC to Georgia time (UTC+4)
  const ge = new Date(dt.getTime() + 4 * 60 * 60 * 1000);
  
  const day = String(ge.getUTCDate()).padStart(2, "0");
  const month = String(ge.getUTCMonth() + 1).padStart(2, "0");
  const year = ge.getUTCFullYear();
  const hours = String(ge.getUTCHours()).padStart(2, "0");
  const minutes = String(ge.getUTCMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

/**
 * Format reveal time to readable format in Georgia timezone
 */
function formatRevealTime(utcIso: string): string {
  const dt = new Date(utcIso);
  // Convert UTC to Georgia time (UTC+4)
  const ge = new Date(dt.getTime() + 4 * 60 * 60 * 1000);

  const day = ge.getUTCDate();
  const monthIndex = ge.getUTCMonth();
  const hours = String(ge.getUTCHours()).padStart(2, "0");
  const minutes = String(ge.getUTCMinutes()).padStart(2, "0");

  // Georgian month abbreviations
  const georgianMonths = [
    "იან", "თებ", "მარ", "აპრ", "მაი", "ივნ",
    "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"
  ];

  return `${day} ${georgianMonths[monthIndex]} ${hours}:${minutes}`;
}

// ============ Main Component ============

export default function QuizResults() {
  const { id: quizId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get("fromTab") || "today";

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuizResultsResponse | null>(null);

  // ============ Fetch Results ============

  const fetchResults = useCallback(async () => {
    if (!quizId) return;

    try {
      const data = await quizApi.getResults(quizId);
      setResults(data);
    } catch (error: unknown) {
      console.error("Error fetching results:", error);
      const errorMessage = error instanceof Error ? error.message : "შედეგების ჩატვირთვა ვერ მოხერხდა";

      // Handle specific error codes
      if (errorMessage.includes("NO_SUBMISSION") || errorMessage.includes("NOT_SUBMITTED") || errorMessage.includes("ვერ მოიძებნა")) {
        toast({
          variant: "destructive",
          title: "შედეგები ვერ მოიძებნა",
          description: "თქვენ ჯერ არ შეასრულეთ ეს ქვიზი",
        });
        navigate(`/quiz/${quizId}`);
        return;
      } else if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("ვერ მოიძებნა")) {
        toast({
          variant: "destructive",
          title: "ქვიზი ვერ მოიძებნა",
          description: "მოთხოვნილი ქვიზი არ არსებობს",
        });
        navigate("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "შეცდომა",
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [quizId, navigate, toast]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchResults();
  }, [user, fetchResults, navigate]);

  // ============ Derived Data ============

  /**
   * Map question ID to user's answer
   */
  const answersByQuestionId = useMemo(() => {
    if (!results?.userAnswers) return {};

    return results.userAnswers.reduce((acc, answer) => {
      acc[answer.question_id] = answer;
      return acc;
    }, {} as Record<string, typeof results.userAnswers[0]>);
  }, [results?.userAnswers]);

  /**
   * Calculate stats
   */
  const stats = useMemo(() => {
    if (!results) return { correct: 0, total: 0, percentage: 0 };

    const total = results.questions.length;
    const correct = results.userAnswers.filter((a) => a.is_correct).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { correct, total, percentage };
  }, [results]);

  /**
   * Points per correct answer (based on is_late flag)
   */
  const pointsPerCorrect = results?.submission?.is_late ? 5 : 10;

  // ============ Handlers ============

  const handleBackToDashboard = useCallback(() => {
    navigate(`/dashboard?tab=${fromTab}`);
  }, [navigate, fromTab]);

  const handlePractice = useCallback(() => {
    navigate(`/quiz/${quizId}?practice=true&fromTab=${fromTab}`);
  }, [navigate, quizId, fromTab]);

  // ============ Render ============

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">შედეგები იტვირთება...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (!results) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">შედეგები ვერ მოიძებნა</p>
          <Button variant="outline" className="mt-4" onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            დაბრუნება
          </Button>
        </div>
      </Layout>
    );
  }

  const { quiz, submission, questions, answersRevealed, answersRevealTime } = results;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Link */}
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          უკან
        </button>

        {/* Header Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{quiz.title}</CardTitle>
                <p className="text-muted-foreground mt-1">შედეგები</p>
              </div>
              <div className="flex items-center gap-2">
                {submission.is_late && (
                  <Badge variant="secondary">დაგვიანებული</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Score Display */}
            <div className="flex items-center justify-center gap-4 p-6 rounded-lg bg-primary/10 border border-primary/20">
              <Trophy className="w-10 h-10 text-primary" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">თქვენი ქულა</p>
                <p className="text-4xl font-display font-bold text-primary">
                  {submission.total_score}
                </p>
                {/* Only show correct/total when answers are revealed */}
                {answersRevealed && (
                  <p className="text-sm text-muted-foreground">
                    {stats.correct} / {stats.total} სწორი ({stats.percentage}%)
                  </p>
                )}
              </div>
            </div>

            {/* Stats Row - Only show when answers revealed */}
            {answersRevealed ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">გაგზავნის დრო</p>
                  <p className="font-medium text-sm">{formatSubmissionTime(submission.submitted_at)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">ქულა/კითხვა</p>
                  <p className="font-medium">{pointsPerCorrect} ქულა</p>
                </div>
              </div>
            ) : (
              /* Before answers revealed - show submission time only */
              <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">გაგზავნის დრო</p>
                <p className="font-medium text-sm">{formatSubmissionTime(submission.submitted_at)}</p>
              </div>
            )}

            {/* Answers Reveal Notice */}
            {!answersRevealed && answersRevealTime && (
              <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                  <Clock className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                  დეტალური შედეგები და სწორი პასუხები გამოჩნდება {formatRevealTime(answersRevealTime)} საათზე
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Review */}
        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, i) => {
              const userAnswer = answersByQuestionId[q.id];
              const isCorrect = userAnswer?.is_correct;
              const hasCorrectInfo = typeof isCorrect === 'boolean'; // Only true after answers revealed

              return (
                <Card
                  key={q.id}
                  variant="default"
                  className={`border-l-4 ${
                    hasCorrectInfo
                      ? isCorrect
                        ? "border-l-success"
                        : "border-l-destructive"
                      : "border-l-cyan-500" // Blue/cyan color before reveal
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        კითხვა {i + 1}. {q.question_text}
                      </CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasCorrectInfo ? (
                          // After reveal: show correct/wrong icon
                          isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )
                        ) : (
                          // Before reveal: show neutral clock/pending icon
                          <Clock className="w-5 h-5 text-cyan-500" />
                        )}
                      </div>
                    </div>
                    {/* Only show points per question after answers revealed */}
                    {hasCorrectInfo && (
                      <p className="text-sm text-accent">
                        {userAnswer?.points_earned || 0} / {pointsPerCorrect} ქულა
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* User's Answer */}
                    <div
                      className={`p-3 rounded-lg ${
                        hasCorrectInfo
                          ? isCorrect
                            ? "bg-success/10 border border-success/20"
                            : "bg-destructive/10 border border-destructive/20"
                          : "bg-cyan-500/10 border border-cyan-500/20" // Blue/cyan style before reveal
                      }`}
                    >
                      <p className="text-sm text-muted-foreground">თქვენი პასუხი:</p>
                      <p className="font-medium">{userAnswer?.answer || "—"}</p>
                    </div>

                    {/* Correct Answer (only shown after reveal and if wrong) */}
                    {hasCorrectInfo && !isCorrect && q.correct_answer && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-sm text-muted-foreground">სწორი პასუხი:</p>
                        <p className="font-medium text-success">{q.correct_answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="secondary"
            className={answersRevealed ? "flex-1" : "w-full"}
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            დაბრუნება
          </Button>
          {/* Practice button only available after answers are revealed */}
          {answersRevealed && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePractice}
            >
              <RotateCcw className="w-5 h-5 mr-1" />
              პრაქტიკა
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}