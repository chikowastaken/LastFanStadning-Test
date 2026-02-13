import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KMKRoundResult, KMKChoice, CHOICE_EMOJI, TOTAL_ROUNDS } from '@/lib/kmk';
import { Share2, RotateCcw, Download, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KMKResultsProps {
  results: KMKRoundResult[];
  onReplay: () => void;
}

const CHOICE_TEXT: Record<KMKChoice, string> = {
  kiss: 'text-kiss',
  marry: 'text-marry',
  kill: 'text-kill',
};

export function KMKResults({ results, onReplay }: KMKResultsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const generateShareImage = useCallback(async (): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Calculate dynamic height
    // Header: 400px
    // Per Round: ~550px (Title 60 + Header 60 + Card 400 + Gap 30)
    // Footer: 200px
    const ROUND_HEIGHT = 580;
    const HEADER_HEIGHT = 400;
    const FOOTER_HEIGHT = 200;
    canvas.width = 1080;
    canvas.height = HEADER_HEIGHT + (results.length * ROUND_HEIGHT) + FOOTER_HEIGHT;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.5, '#0f1d32');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Blobs
    ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
    ctx.beginPath();
    ctx.arc(200, 300, 400, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(249, 115, 22, 0.06)';
    ctx.beginPath();
    ctx.arc(900, canvas.height - 300, 350, 0, Math.PI * 2);
    ctx.fill();

    // Text Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Kiss Marry Kill', 540, 200);

    ctx.fillStyle = '#64748b';
    ctx.font = '36px sans-serif';
    ctx.fillText('ჩემი შედეგები', 540, 270);

    // Draw Rounds
    let y = HEADER_HEIGHT;
    const choices: KMKChoice[] = ['kiss', 'marry', 'kill'];
    const COL_WIDTH = 300;
    const GAP = 40;
    const START_X = (1080 - (3 * COL_WIDTH) - (2 * GAP)) / 2; // (1080 - 900 - 80) / 2 = 50

    // Pre-load all character images
    const imageUrls = results.flatMap(r => r.characters.map(c => c.image_url)).filter(Boolean) as string[];
    const loadedImages = new Map<string, HTMLImageElement>();

    try {
      await Promise.all(imageUrls.map(async (url) => {
        if (!loadedImages.has(url)) {
          try {
            const img = await loadImage(url);
            loadedImages.set(url, img);
          } catch (e) {
            console.warn('Failed to load image:', url);
          }
        }
      }));
    } catch (e) {
      console.warn('Error loading images', e);
    }

    for (let i = 0; i < results.length; i++) {
      const round = results[i];

      // Round Title
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`ROUND ${i + 1}`, 540, y);

      // Horizontal Line/Divider logic could go here, omitting for simplicity
      y += 60;

      // Draw 3 Cards
      for (let j = 0; j < choices.length; j++) {
        const choice = choices[j];
        const character = getCharacterByChoice(round, choice);
        const x = START_X + j * (COL_WIDTH + GAP);

        // Choice Icon/Label
        const color = choice === 'kiss' ? '#ec4899' : choice === 'marry' ? '#f59e0b' : '#ef4444';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.font = '40px sans-serif';
        ctx.fillText(CHOICE_EMOJI[choice], x + COL_WIDTH / 2, y + 35);

        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(choice.toUpperCase(), x + COL_WIDTH / 2, y + 65);

        // Card Y start
        const cardY = y + 80;
        const cardH = 400; // Aspect 3:4

        // Draw Card
        if (character) {
          // Card Shape (Rounded)
          drawRoundedRect(ctx, x, cardY, COL_WIDTH, cardH, 20);

          ctx.save();
          ctx.clip(); // Clip to rounded rect

          // Background
          ctx.fillStyle = '#1e293b';
          ctx.fill();

          // Image
          if (character.image_url && loadedImages.has(character.image_url)) {
            const img = loadedImages.get(character.image_url)!;
            // Draw Cover
            // Calculate aspect ratio
            const imgRatio = img.width / img.height;
            const cardRatio = COL_WIDTH / cardH;
            let sw, sh, sx, sy;

            if (imgRatio > cardRatio) {
              sh = img.height;
              sw = sh * cardRatio;
              sy = 0;
              sx = (img.width - sw) / 2;
            } else {
              sw = img.width;
              sh = sw / cardRatio;
              sx = 0;
              sy = (img.height - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, x, cardY, COL_WIDTH, cardH);
          } else {
            // Placeholder Icon?
            ctx.fillStyle = '#334155';
            ctx.fillRect(x, cardY, COL_WIDTH, cardH);
            // Could draw an emoji or generic icon
          }

          // Name Overlay (Bottom)
          const overlayH = 60;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(x, cardY + cardH - overlayH, COL_WIDTH, overlayH);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(character.name, x + COL_WIDTH / 2, cardY + cardH - 22);

          ctx.restore(); // Remove clip

          // Border (Dashed)
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.setLineDash([15, 10]);
          drawRoundedRect(ctx, x, cardY, COL_WIDTH, cardH, 20);
          ctx.stroke();
          ctx.restore();

        } else {
          // Empty Slot
          ctx.save();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          drawRoundedRect(ctx, x, cardY, COL_WIDTH, cardH, 20);
          ctx.stroke();
          ctx.restore();
        }
      }
      y += 520; // Move down for next round
    }

    // Footer
    y += 50;
    ctx.fillStyle = '#475569';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('lastfanstanding.ge', 540, canvas.height - 100);
    ctx.fillStyle = '#0ea5e9';
    ctx.font = '48px sans-serif';
    ctx.fillText('❤️', 540, canvas.height - 40);

    return canvas.toDataURL('image/png');
  }, [results]);

  const handleDownload = async () => {
    const imageUrl = await generateShareImage();
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = 'kmk-results.png';
    link.href = imageUrl;
    link.click();
  };

  const handleShare = async () => {
    const imageUrl = await generateShareImage();
    if (!imageUrl) return;
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'kmk-results.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Kiss Marry Kill Results', text: 'Check out my choices!' });
          return;
        }
      } catch (err) {
        console.log('Share cancelled:', err);
      }
    }
    handleDownload();
  };

  const getCharacterByChoice = (round: KMKRoundResult, choice: KMKChoice) =>
    round.characters.find((c) => round.choices[c.id] === choice);

  return (
    <div className="min-h-[70vh] flex flex-col p-4 animate-slide-up">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <Card variant="elevated" className="mb-6 border-shimmer">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-4 rounded-2xl bg-gradient-primary shadow-glow animate-pulse-glow">
              <Heart className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">შენი არჩევანი</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {TOTAL_ROUNDS} რაუნდი საეჭვო გადაწყვეტილებები
          </p>
        </CardHeader>
      </Card>

      {/* Results */}
      <div className="space-y-8 mb-8">
        {results.map((round, index) => (
          <div key={index} className="space-y-4 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border/50" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
                Round {index + 1}
              </h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {(['kiss', 'marry', 'kill'] as KMKChoice[]).map((choice) => {
                const character = getCharacterByChoice(round, choice);
                const styles = {
                  kiss: 'border-kiss/60 shadow-[0_0_15px_hsl(var(--kiss)/0.15)]',
                  marry: 'border-marry/60 shadow-[0_0_15px_hsl(var(--marry)/0.15)]',
                  kill: 'border-kill/60 shadow-[0_0_15px_hsl(var(--kill)/0.15)]',
                };
                const textColors = {
                  kiss: 'text-kiss',
                  marry: 'text-marry',
                  kill: 'text-kill',
                };

                return (
                  <div key={choice} className="flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center text-center gap-0.5 min-h-[40px]">
                      <span className="text-xl sm:text-2xl leading-none filter drop-shadow-md">{CHOICE_EMOJI[choice]}</span>
                      <span className={cn('text-[10px] sm:text-xs font-bold uppercase tracking-widest', textColors[choice])}>
                        {choice}
                      </span>
                    </div>

                    {/* Card */}
                    {character ? (
                      <div className={cn(
                        "relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-300 group hover:scale-[1.02]",
                        styles[choice]
                      )}>
                        {/* Image */}
                        <div className="w-full h-full bg-secondary/50">
                          {character.image_url ? (
                            <img
                              src={character.image_url}
                              alt={character.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>

                        {/* Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-2 text-center text-white border-t border-white/10">
                          <p className="font-bold text-[10px] sm:text-xs truncate px-1">
                            {character.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-muted flex items-center justify-center bg-muted/20">
                        <span className="text-muted-foreground/30 text-xs">-</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Share */}
      <Card variant="gradient" className="mb-5 border-shimmer">
        <CardContent className="py-6 text-center">
          <p className="font-bold mb-1">გააზიარე შენი არჩევანი</p>
          <p className="text-sm text-muted-foreground mb-4">
            დაპოსტე და ნება მიეცი განგსაჯონ
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              გაზიარება
            </Button>
            <Button variant="outline" size="lg" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Replay */}
      <Button variant="outline" size="lg" className="w-full" onClick={onReplay}>
        <RotateCcw className="w-4 h-4 mr-2" />
        თავიდან ითამაშე
      </Button>
    </div>
  );
}
