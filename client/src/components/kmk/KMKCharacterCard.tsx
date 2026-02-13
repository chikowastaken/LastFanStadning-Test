import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { KMKCharacter, KMKChoice, CHOICE_EMOJI } from '@/lib/kmk';
import { User } from 'lucide-react';

interface KMKCharacterCardProps {
  character: KMKCharacter;
  choice?: KMKChoice;
  onChoiceChange?: (choice: KMKChoice) => void;
  disabled?: boolean;
  showChoiceSelector?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
}

const CHOICE_RING: Record<KMKChoice, string> = {
  kiss: 'ring-2 ring-kiss bg-kiss/10',
  marry: 'ring-2 ring-marry bg-marry/10',
  kill: 'ring-2 ring-kill bg-kill/10',
};

const CHOICE_BADGE: Record<KMKChoice, string> = {
  kiss: 'bg-kiss/20 border-kiss/50',
  marry: 'bg-marry/20 border-marry/50',
  kill: 'bg-kill/20 border-kill/50',
};

export function KMKCharacterCard({
  character,
  choice,
  onChoiceChange,
  disabled = false,
  showChoiceSelector = true,
  draggable = false,
  isDragging = false,
}: KMKCharacterCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: character.id,
    disabled: !draggable || disabled,
  });

  const cycleChoice = () => {
    if (disabled || !onChoiceChange || draggable) return;
    const choices: KMKChoice[] = ['kiss', 'marry', 'kill'];
    if (!choice) {
      onChoiceChange('kiss');
    } else {
      const currentIndex = choices.indexOf(choice);
      const nextIndex = (currentIndex + 1) % choices.length;
      onChoiceChange(choices[nextIndex]);
    }
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <Card
      ref={draggable ? setNodeRef : undefined}
      variant="elevated"
      style={style}
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        draggable && 'cursor-grab active:cursor-grabbing touch-none',
        !draggable && showChoiceSelector && 'cursor-pointer hover:scale-[1.03] active:scale-[0.97]',
        choice && CHOICE_RING[choice],
        disabled && 'opacity-50 cursor-not-allowed',
        isDragging && 'opacity-40 scale-95 rotate-2'
      )}
      onClick={!draggable && showChoiceSelector ? cycleChoice : undefined}
      {...(draggable ? { ...attributes, ...listeners } : {})}
    >
      {/* Character Image */}
      <div className="aspect-[3/4] bg-secondary/50 flex items-center justify-center overflow-hidden relative">
        {character.image_url ? (
          <img
            src={character.image_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/60">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2">
              <User className="w-7 h-7" />
            </div>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* Character Name */}
      <div className="p-2.5 text-center relative">
        <p className="font-semibold text-sm truncate">{character.name}</p>
      </div>

      {/* Choice Badge */}
      {choice && (
        <div
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full border flex items-center justify-center text-base animate-scale-bounce',
            CHOICE_BADGE[choice]
          )}
        >
          {CHOICE_EMOJI[choice]}
        </div>
      )}

      {/* Hover overlay */}
      {showChoiceSelector && !choice && !disabled && !draggable && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm opacity-0 hover:opacity-50 transition-all duration-200">
          <span className="text-foreground text-sm font-medium px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">ჩასვი</span>
        </div>
      )}

      {/* Drag hint */}
      {draggable && !disabled && !isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm opacity-0 hover:opacity-50 transition-all duration-200">
          <span className="text-foreground text-sm font-medium px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">ჩასვი</span>
        </div>
      )}
    </Card>
  );
}
