import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KMKPreference } from '@/lib/kmk';
import { Heart, Sparkles } from 'lucide-react';

interface KMKGenderSelectProps {
  onSelect: (preference: KMKPreference) => void;
}

export function KMKGenderSelect({ onSelect }: KMKGenderSelectProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl p-[1px] bg-gradient-to-r from-primary via-primary/50 to-accent animate-scale-bounce shadow-2xl">
        <Card variant="elevated" className="w-full h-full border-0 bg-card">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="p-5 rounded-2xl bg-gradient-primary shadow-glow">
                  <Heart className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse-dot" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold">
              <span className="text-gradient-primary">Kiss</span>{' '}
              <span className="text-gradient-accent">Marry</span>{' '}
              <span className="text-destructive">Kill</span>
            </CardTitle>
            <CardDescription className="text-base mt-3">
              5 რაუნდი. აირჩიე გონივრულად.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-center text-muted-foreground text-sm">
              ვინ გაინტერესებს?
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="hero"
                size="lg"
                className="h-24 flex-col gap-2 text-lg shadow-[0_0_30px_hsl(199_89%_48%_/_0.3)] hover:shadow-[0_0_40px_hsl(199_89%_48%_/_0.5)]"
                onClick={() => onSelect('girl')}
              >
                <span className="text-3xl">👨</span>
                <span className="text-sm font-semibold">კაცები</span>
              </Button>

              <Button
                variant="accent"
                size="lg"
                className="h-24 flex-col gap-2 text-lg shadow-[0_0_30px_hsl(38_92%_50%_/_0.3)] hover:shadow-[0_0_40px_hsl(38_92%_50%_/_0.5)]"
                onClick={() => onSelect('boy')}
              >
                <span className="text-3xl">👩</span>
                <span className="text-sm font-semibold">ქალები</span>
              </Button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-3 text-muted-foreground bg-card rounded-full">ან</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="w-full group sm:text-base text-sm"
              onClick={() => onSelect('all')}
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover:text-accent transition-colors" />
              გამიკვირე (ყველა პერსონაჟი)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
