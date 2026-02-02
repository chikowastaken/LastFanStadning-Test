import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  day_number: number;
  start_at: string;
  end_at: string;
}

interface CompletedTabProps {
  quizzes: Quiz[];
  submissions: Record<string, number>;
  fromTab: string;
}

const CompletedTab = memo(function CompletedTab({ quizzes, submissions, fromTab }: CompletedTabProps) {
  const navigate = useNavigate();

  const completedQuizzes = useMemo(() =>
    quizzes.filter((quiz) => quiz.id in submissions),
    [quizzes, submissions]
  );

  if (completedQuizzes.length === 0) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <CardContent>
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">ჯერ ქვიზი არ გაქვთ გავლილი</h3>
          <p className="text-muted-foreground">დაიწყეთ დღევანდელი ქვიზით!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {completedQuizzes.map((quiz) => (
        <Card key={quiz.id} variant="elevated" className="relative overflow-hidden">
          {/* Badge - desktop only */}
          <div className="absolute top-4 right-4 hidden md:block">
            <Badge className="bg-success text-success-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              დასრულებული
            </Badge>
          </div>

          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="w-4 h-4" />
              დღე {quiz.day_number}
              {/* Badge - mobile only */}
              <Badge className="bg-success text-success-foreground md:hidden">
                <CheckCircle className="w-3 h-3 mr-1" />
                დასრულებული
              </Badge>
            </div>
            <CardTitle className="text-xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription>{quiz.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
              <Trophy className="w-6 h-6 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">მიღებული ქულა</p>
                <p className="text-2xl font-display font-bold text-success">
                  {submissions[quiz.id]} ქულა
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate(`/quiz/${quiz.id}/results?fromTab=${fromTab}`)}
            >
              შედეგების ნახვა
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default CompletedTab;
