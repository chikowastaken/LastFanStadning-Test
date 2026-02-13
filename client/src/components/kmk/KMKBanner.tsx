import { useState } from 'react';
import { X, Heart, Skull, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KMKBannerProps {
  onPlay?: () => void;
  className?: string;
}

export function KMKBanner({ onPlay, className }: KMKBannerProps) {
  const [showBanner, setShowBanner] = useState(true);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        'relative rounded-xl border border-kiss/30 bg-gradient-to-r from-kiss/10 via-marry/5 to-kill/10 shadow-[0_0_25px_rgba(236,72,153,0.12)] overflow-hidden',
        className
      )}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-kiss/8 to-transparent" />
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setShowBanner(false)}
        className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Icon cluster */}
          <div className="flex-shrink-0 flex items-center gap-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-kiss/25 to-kiss/10 border border-kiss/30 flex items-center justify-center -rotate-6">
              <span className="text-2xl sm:text-3xl">💋</span>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-marry/25 to-marry/10 border border-marry/30 flex items-center justify-center z-10 -mx-2 scale-110">
              <span className="text-2xl sm:text-3xl">💍</span>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-kill/25 to-kill/10 border border-kill/30 flex items-center justify-center rotate-6">
              <span className="text-2xl sm:text-3xl">💀</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <h3 className="font-display font-bold text-base sm:text-lg text-kiss">
              Kiss Marry Kill 🔥
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              აირჩიე ვის აკოცებ, ვის მოკლავ და ვისზე იქორწინებ — 5 რაუნდი, საეჭვო გადაწყვეტილებები!
            </p>

            {/* Mini choice badges */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-kiss bg-kiss/10 border border-kiss/20 rounded-full px-2.5 py-0.5">
                <Heart className="w-3 h-3" /> Kiss
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-marry bg-marry/10 border border-marry/20 rounded-full px-2.5 py-0.5">
                <Sparkles className="w-3 h-3" /> Marry
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-kill bg-kill/10 border border-kill/20 rounded-full px-2.5 py-0.5">
                <Skull className="w-3 h-3" /> Kill
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            {/* <Button
              size="lg"
              onClick={onPlay}
              className="w-full sm:w-auto bg-kiss hover:bg-kiss/90 text-white font-bold text-base gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
            >
              ითამაშე
              <span className="text-lg">→</span>
            </Button> */}
            <Button
              size="lg"
              onClick={onPlay}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 hover:from-pink-400 hover:via-purple-400 hover:to-rose-400 text-white font-bold text-base gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
            >
              <Heart className="w-4 h-4" />
              ითამაშე
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
