import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trophy, CheckCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    day_number: number;
    is_locked: boolean;
    start_at: string;
    end_at: string;
  };
  hasSubmitted?: boolean;
  score?: number;
}

export default function QuizCard({ quiz, hasSubmitted, score }: QuizCardProps) {
  const navigate = useNavigate();

  const isAvailable = !quiz.is_locked && !hasSubmitted;

  const getStatus = () => {
    if (hasSubmitted) return { label: "დასრულებული", color: "bg-success text-success-foreground" };
    if (quiz.is_locked) return { label: "დაბლოკილი", color: "bg-muted text-muted-foreground" };
    return { label: "ხელმისაწვდომი", color: "bg-primary text-primary-foreground" };
  };

  const status = getStatus();

  return (
    <Card 
      variant="elevated" 
      className={`relative overflow-hidden transition-all hover:scale-[1.02] ${
        isAvailable ? "ring-2 ring-primary shadow-glow" : ""
      }`}
    >
      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <Badge className={status.color}>{status.label}</Badge>
      </div>

      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Clock className="w-4 h-4" />
          დღე {quiz.day_number}
        </div>
        <CardTitle className="text-xl">{quiz.title}</CardTitle>
        {quiz.description && (
          <CardDescription>{quiz.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {hasSubmitted && score !== undefined && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">თქვენი ქულა</p>
              <p className="text-2xl font-display font-bold text-success">{score} ქულა</p>
            </div>
          </div>
        )}

        {quiz.is_locked && !hasSubmitted && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <p className="text-muted-foreground">ეს ქვიზი დაბლოკილია</p>
          </div>
        )}

        {/* Action button */}
        {isAvailable && (
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/quiz/${quiz.id}`)}
          >
            <Trophy className="w-5 h-5" />
            ქვიზის დაწყება
          </Button>
        )}

        {hasSubmitted && (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/quiz/${quiz.id}/results`)}
          >
            შედეგების ნახვა
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
