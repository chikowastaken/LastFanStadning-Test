import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, DragOverlay } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KMKCharacterCard } from './KMKCharacterCard';
import { KMKDropZone } from './KMKDropZone';
import { KMKCharacter, KMKChoice, TOTAL_ROUNDS, CHOICE_EMOJI } from '@/lib/kmk';
import { ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react';

interface KMKRoundProps {
  round: number;
  characters: KMKCharacter[];
  onComplete: (choices: Record<string, KMKChoice>) => void;
  onStartOver: () => void;
}

export function KMKRound({ round, characters, onComplete, onStartOver }: KMKRoundProps) {
  const [choices, setChoices] = useState<Record<string, KMKChoice>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    setChoices({});
    setActiveId(null);
    setOverId(null);
  }, [round]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && ['kiss', 'marry', 'kill'].includes(over.id as string)) {
      const characterId = active.id as string;
      const newChoice = over.id as KMKChoice;

      setChoices((prev) => {
        const newChoices = { ...prev };
        const oldChoice = newChoices[characterId];

        if (oldChoice === newChoice) return prev;

        const characterInTargetZone = Object.keys(newChoices).find(
          (id) => newChoices[id] === newChoice && id !== characterId
        );

        if (characterInTargetZone && oldChoice) {
          newChoices[characterInTargetZone] = oldChoice;
        } else if (characterInTargetZone) {
          delete newChoices[characterInTargetZone];
        }

        newChoices[characterId] = newChoice;
        return newChoices;
      });
    }

    setActiveId(null);
    setOverId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const allChoicesMade = Object.keys(choices).length === 3;
  const usedChoices = new Set(Object.values(choices));
  const availableCharacters = characters.filter((c) => !choices[c.id]);

  const getCharacterById = (id: string) => characters.find((c) => c.id === id);
  const getCharacterForChoice = (choice: KMKChoice) => {
    const characterId = Object.keys(choices).find((id) => choices[id] === choice);
    return characterId ? getCharacterById(characterId) : null;
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-[70vh] flex flex-col p-4 animate-slide-up">
        {/* Round Header */}
        <Card variant="elevated" className="mb-5">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                რაუნდი <span className="text-gradient-primary">{round}</span>
                <span className="text-muted-foreground font-normal"> / {TOTAL_ROUNDS}</span>
              </CardTitle>
              <div className="flex gap-1.5">
                {(['kiss', 'marry', 'kill'] as KMKChoice[]).map((c) => (
                  <span
                    key={c}
                    className={`text-lg transition-all duration-300 ${usedChoices.has(c) ? 'opacity-20 scale-75' : 'opacity-100'}`}
                  >
                    {CHOICE_EMOJI[c]}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">
              ჩასვი პერსონაჟები სასურველ ზონაში
            </p>
          </CardContent>
        </Card>

        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-1.5 mb-6 overflow-hidden">
          <div
            className="bg-gradient-primary h-full rounded-full transition-all duration-500 ease-out shadow-glow"
            style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
          />
        </div>

        {/* Available Characters */}
        <div className="mb-5">
          <p className="text-[10px] text-muted-foreground mb-2 text-center uppercase tracking-widest font-medium">
            პერსონაჟები
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {availableCharacters.map((character) => (
              <KMKCharacterCard
                key={character.id}
                character={character}
                draggable
                isDragging={activeId === character.id}
              />
            ))}
            {characters.map((character) =>
              choices[character.id] ? (
                <div key={`placeholder-${character.id}`} className="aspect-[3/4] opacity-0" />
              ) : null
            )}
          </div>
        </div>

        {/* Drop Zones */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {(['kiss', 'marry', 'kill'] as KMKChoice[]).map((choice) => (
              <KMKDropZone
                key={choice}
                choice={choice}
                character={getCharacterForChoice(choice) || null}
                isOver={overId === choice}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={onStartOver}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setChoices({})}
            disabled={Object.keys(choices).length === 0}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="hero"
            size="lg"
            className="flex-1"
            onClick={() => onComplete(choices)}
            disabled={!allChoicesMade}
          >
            {round === TOTAL_ROUNDS ? 'შედეგების ნახვა' : 'შემდეგი რაუნდი'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="rotate-3 scale-110 opacity-90 shadow-elevated">
            <KMKCharacterCard
              character={getCharacterById(activeId)!}
              draggable={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
