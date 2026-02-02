import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Zap, Users, Loader2, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "შესვლა ვერ მოხერხდა",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4 relative">
      <SEO 
        title="შესვლა - LastFanStanding | დაიწყე თამაში Google-ით"
        description="კეთილი იყოს თქვენი მობრძანება LFS-ზე. შედით Google-ის ანგარიშით, ჩაერთეთ ყოველკვირეულ გამოწვევებში, დააგროვეთ ქულები და დაიკავეთ ადგილი გლობალურ რეიტინგში. ეპიკური ჯილდოები გელოდებათ!"
      />
      {/* Back Link - Top Left Corner */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        უკან
      </Link>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-slide-in-up">
           <div className="flex items-center justify-center mb-8 animate-scale-in">
              <img 
                src="/images/full-logo-text.png" 
                alt="LastFanStanding Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
          {/* <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
            LastFanStanding
          </h1> */}
          <p className="text-muted-foreground">
            ყოველკვირეული გამოწვევები. გლობალური რეიტინგები. ეპიკური ჯილდოები.
          </p>
        </div>

        {/* Auth Card */}
        <Card variant="elevated" className="animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle>კეთილი იყოს თქვენი მობრძანება</CardTitle>
            <CardDescription>
              შედით Google ანგარიშით თამაშის დასაწყებად
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-12 text-base"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google-ით შესვლა
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              შესვლით თქვენ ეთანხმებით მომსახურების პირობებს
            </p>
          </CardContent>
        </Card>

        {/* Features preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-2">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">ყოველდღიური ქვიზები</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-2">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">მოაგროვე ქულები</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-2">
              <Users className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">გლობალური კონკურენცია</p>
          </div>
        </div>
      </div>
    </div>
  );
}