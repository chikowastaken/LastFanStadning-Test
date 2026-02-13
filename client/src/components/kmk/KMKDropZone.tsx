import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { KMKCharacter, KMKChoice, CHOICE_EMOJI, CHOICE_LABELS } from '@/lib/kmk';
import { User } from 'lucide-react';

interface KMKDropZoneProps {
  choice: KMKChoice;
  character: KMKCharacter | null;
  isOver?: boolean;
}

const ZONE_STYLES: Record<KMKChoice, { idle: string; hover: string; text: string; gradient: string }> = {
  kiss: {
    idle: 'border-kiss/30 bg-kiss/5',
    hover: 'border-kiss bg-kiss/15 ring-2 ring-kiss/40 shadow-[0_0_30px_hsl(var(--kiss)/0.2)]',
    text: 'text-kiss',
    gradient: 'bg-gradient-kiss',
  },
  marry: {
    idle: 'border-marry/30 bg-marry/5',
    hover: 'border-marry bg-marry/15 ring-2 ring-marry/40 shadow-[0_0_30px_hsl(var(--marry)/0.2)]',
    text: 'text-marry',
    gradient: 'bg-gradient-marry',
  },
  kill: {
    idle: 'border-kill/30 bg-kill/5',
    hover: 'border-kill bg-kill/15 ring-2 ring-kill/40 shadow-[0_0_30px_hsl(var(--kill)/0.2)]',
    text: 'text-kill',
    gradient: 'bg-gradient-kill',
  },
};

export function KMKDropZone({ choice, character, isOver }: KMKDropZoneProps) {
  const { setNodeRef } = useDroppable({ id: choice });
  const styles = ZONE_STYLES[choice];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Choice Label */}
      <div className="flex items-center gap-1.5">
        <span className="text-xl">{CHOICE_EMOJI[choice]}</span>
        <span className={cn('font-bold text-xs uppercase tracking-wider', styles.text)}>
          {CHOICE_LABELS[choice]}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'w-full aspect-[3/4] rounded-xl transition-all duration-300 border-2 border-dashed overflow-hidden',
          styles.idle,
          isOver && styles.hover,
          !character && 'flex items-center justify-center'
        )}
      >
        {character ? (
          <KMKCharacterInZone character={character} />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/40 p-3">
            <span className="text-2xl mb-1.5 opacity-40">{CHOICE_EMOJI[choice]}</span>
            <span className="text-[10px] text-center leading-tight">
              {isOver ? 'გაუშვი აქ' : 'ჩასვი'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function KMKCharacterInZone({ character }: { character: KMKCharacter }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: character.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative w-full h-full cursor-grab active:cursor-grabbing transition-opacity',
        isDragging && 'opacity-40'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="w-full h-full bg-secondary/50 flex items-center justify-center overflow-hidden">
        {character.image_url ? (
          <img
            src={character.image_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/50">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-background/70 backdrop-blur-md p-1.5 text-center">
        <p className="font-semibold text-[11px] truncate">{character.name}</p>
      </div>

      {!isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm opacity-0 hover:opacity-50 transition-all">
          <span className="text-foreground text-xs font-medium px-2 py-1 rounded-full bg-primary/20 border border-primary/30">ჩასვი</span>
        </div>
      )}
    </div>
  );
}
