import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CountdownTimer from "@/components/CountdownTimer";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  day_number: number;
  start_at: string;
  end_at: string;
}

interface TodaysQuizTabProps {
  liveQuiz: Quiz | null;
  upcomingQuiz: Quiz | null;
  hasSubmitted: boolean;
  onQuizEnd?: () => void;
  fromTab: string;
}

const TodaysQuizTab = memo(function TodaysQuizTab({ liveQuiz, upcomingQuiz, hasSubmitted, onQuizEnd, fromTab }: TodaysQuizTabProps) {
  const navigate = useNavigate();

  if (liveQuiz && !hasSubmitted) {
    return (
      <Card variant="gradient" className="relative overflow-hidden ring-2 ring-primary shadow-glow">
        <div className="absolute top-4 right-4 hidden md:block">
          <Badge className="bg-success text-success-foreground animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" />
            ლაივი
          </Badge>
        </div>

        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-4 h-4" />
            დღე {liveQuiz.day_number}
            <Badge className="bg-success text-success-foreground animate-pulse md:hidden">
              <Sparkles className="w-3 h-3 mr-1" />
              ლაივი
            </Badge>
          </div>
          <CardTitle className="text-2xl">{liveQuiz.title}</CardTitle>
          {liveQuiz.description && (
            <CardDescription className="text-base">{liveQuiz.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Trophy className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">სწორი პასუხისთვის</p>
              <p className="text-xl font-display font-bold text-primary">10 ქულა</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">დარჩენილი დრო:</p>
            <CountdownTimer targetDate={new Date(liveQuiz.end_at)} onComplete={onQuizEnd} />
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => navigate(`/quiz/${liveQuiz.id}?fromTab=${fromTab}`)}
          >
            <Trophy className="w-5 h-5" />
            ქვიზის დაწყება
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (liveQuiz && hasSubmitted) {
    return (
      <Card variant="elevated" className="text-center py-12">
        <CardContent>
          <Trophy className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">დღევანდელი ქვიზი დასრულებულია!</h3>
          <p className="text-muted-foreground mb-4">შეგიძლიათ ნახოთ შედეგები</p>
          <Button
            variant="secondary"
            onClick={() => navigate(`/quiz/${liveQuiz.id}/results?fromTab=${fromTab}`)}
          >
            შედეგების ნახვა
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (upcomingQuiz) {
    return (
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-4 right-4 hidden md:block">
          <Badge variant="outline">მომავალი</Badge>
        </div>

        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-4 h-4" />
            დღე {upcomingQuiz.day_number}
            <Badge variant="outline" className="md:hidden">მომავალი</Badge>
          </div>
          <CardTitle className="text-2xl">{upcomingQuiz.title}</CardTitle>
          {upcomingQuiz.description && (
            <CardDescription className="text-base">{upcomingQuiz.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center p-6 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-3">ქვიზი დაიწყება:</p>
            <CountdownTimer targetDate={new Date(upcomingQuiz.start_at)} onComplete={onQuizEnd} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="text-center py-12">
      <CardContent>
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">დღეს ქვიზი არ არის</h3>
        <p className="text-muted-foreground">შეამოწმეთ არქივი წინა ქვიზებისთვის</p>
      </CardContent>
    </Card>
  );
});

export default TodaysQuizTab;
