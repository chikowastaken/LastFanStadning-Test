import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Archive, Play, RotateCcw, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  day_number: number;
  start_at: string;
  end_at: string;
}

interface ArchiveTabProps {
  quizzes: Quiz[];
  submissions: Record<string, number>;
  fromTab: string;
}

const ArchiveTab = memo(function ArchiveTab({ quizzes, submissions, fromTab }: ArchiveTabProps) {
  const navigate = useNavigate();

  const archivedQuizzes = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();

    return quizzes
      .filter((quiz) => {
        const endTime = new Date(quiz.end_at).getTime();
        return endTime < nowTime;
      })
      .sort((a, b) => {
        const aEndTime = new Date(a.end_at).getTime();
        const bEndTime = new Date(b.end_at).getTime();
        return bEndTime - aEndTime;
      });
  }, [quizzes]);

  if (archivedQuizzes.length === 0) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <CardContent>
          <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">არქივი ცარიელია</h3>
          <p className="text-muted-foreground">წინა ქვიზები აქ გამოჩნდება</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {archivedQuizzes.map((quiz) => {
        const hasCompleted = quiz.id in submissions;

        return (
          <Card key={quiz.id} variant="elevated" className="relative overflow-hidden">
            {/* Badge - desktop only */}
            <div className="absolute top-4 right-4 hidden md:block">
              {hasCompleted ? (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  დასრულებული
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted">
                  <Archive className="w-3 h-3 mr-1" />
                  არქივი
                </Badge>
              )}
            </div>

            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="w-4 h-4" />
                დღე {quiz.day_number}
                {/* Badge - mobile only */}
                {hasCompleted ? (
                  <Badge className="bg-success text-success-foreground md:hidden">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    დასრულებული
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted md:hidden">
                    <Archive className="w-3 h-3 mr-1" />
                    არქივი
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              {quiz.description && (
                <CardDescription>{quiz.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {hasCompleted ? (
                <>
                  <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">მიღებული ქულა</p>
                      <p className="text-2xl font-display font-bold text-success">
                        {submissions[quiz.id]} ქულა
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => navigate(`/quiz/${quiz.id}/results?fromTab=${fromTab}`)}
                    >
                      შედეგები
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/quiz/${quiz.id}?practice=true&fromTab=${fromTab}`)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      პრაქტიკა
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    პრაქტიკა 0 ქულით
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">ხელმისაწვდომი ქულა</p>
                      <p className="text-xl font-display font-bold text-warning">5 ქულა / კითხვა</p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate(`/quiz/${quiz.id}?fromTab=${fromTab}`)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    გავლა
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

export default ArchiveTab;
