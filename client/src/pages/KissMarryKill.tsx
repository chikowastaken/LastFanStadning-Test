import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { KMKBanner } from '@/components/kmk/KMKBanner';
import { KMKGenderSelect } from '@/components/kmk/KMKGenderSelect';
import { KMKRound } from '@/components/kmk/KMKRound';
import { KMKResults } from '@/components/kmk/KMKResults';
import {
  KMKCharacter,
  KMKPreference,
  KMKChoice,
  KMKRoundResult,
  KMKGameState,
  INITIAL_GAME_STATE,
  TOTAL_ROUNDS,
  selectGameCharacters,
  getRoundCharacters,
} from '@/lib/kmk';

type GameScreen = 'loading' | 'gender-select' | 'playing' | 'results';

export default function KissMarryKill() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<GameScreen>('loading');
  const [allCharacters, setAllCharacters] = useState<KMKCharacter[]>([]);
  const [gameState, setGameState] = useState<KMKGameState>(INITIAL_GAME_STATE);
  const [error, setError] = useState<string | null>(null);

  const STORAGE_KEY = 'kmk_game_state_v2';

  // No auth redirect - show promo page for unauth users instead

  // Load state from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Only restore if user matches (optional security/correctness check)
        // For now, we assume simple browser storage.
        if (parsed.gameState && parsed.screen) {
          setGameState(parsed.gameState);
          setScreen(parsed.screen);
          // If we restored, we might not need to fetch all characters if we have them in gameState?
          // But 'allCharacters' state is separate. We should still fetch them or store them?
          // Actually, 'allCharacters' is only used for initial selection.
          // If we are in 'playing' or 'results', we rely on gameState.characters.
        }
      } catch (e) {
        console.error('Failed to parse saved game state', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (gameState !== INITIAL_GAME_STATE && screen !== 'loading' && screen !== 'gender-select') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState, screen }));
    } else if (screen === 'gender-select') {
      // Clear storage if we are back at start
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [gameState, screen]);

  // Fetch characters on mount
  useEffect(() => {
    async function fetchCharacters() {
      try {
        const { data, error } = await supabase
          .from('kmk_characters')
          .select('id, name, gender, image_url');

        if (error) throw error;

        if (data) {
          setAllCharacters(data as KMKCharacter[]);
          // Only set screen to gender-select if we didn't restore a game in progress
          setScreen((prev) => (prev === 'loading' ? 'gender-select' : prev));
        }
      } catch (err) {
        console.error('Failed to fetch characters:', err);
        setError('Failed to load characters. Please try again.');
        setScreen('gender-select');
      }
    }

    if (user) {
      fetchCharacters();
    }
  }, [user]);

  // Handle gender preference selection
  const handlePreferenceSelect = (preference: KMKPreference) => {
    const selectedCharacters = selectGameCharacters(allCharacters, preference);

    const newGameState = {
      preference,
      currentRound: 1,
      characters: selectedCharacters,
      results: [],
    };

    setGameState(newGameState);
    setScreen('playing');
    // Save immediately is handled by useEffect
  };

  // Handle round completion
  const handleRoundComplete = (choices: Record<string, KMKChoice>) => {
    const currentCharacters = getRoundCharacters(
      gameState.characters,
      gameState.currentRound
    );

    const roundResult: KMKRoundResult = {
      round: gameState.currentRound,
      characters: currentCharacters,
      choices,
    };

    const newResults = [...gameState.results, roundResult];

    if (gameState.currentRound === TOTAL_ROUNDS) {
      // Game complete
      setGameState((prev) => ({
        ...prev,
        results: newResults,
      }));
      setScreen('results');
    } else {
      // Next round
      setGameState((prev) => ({
        ...prev,
        currentRound: prev.currentRound + 1,
        results: newResults,
      }));
    }
  };

  // Handle replay
  const handleReplay = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(INITIAL_GAME_STATE);
    setScreen('gender-select');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  // Promo page for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />

        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-kiss/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-marry/5 rounded-full blur-3xl" />
        </div>

        <main className="relative z-10 pt-20 pb-8">
          <div className="m-4 lg:mx-24">
            {/* Banner image */}
            <div className="rounded-2xl overflow-hidden shadow-elevated mb-8">
              <img
                src="/images/KMK-banner.JPG"
                alt="Kiss Marry Kill"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* KMK info banner */}
            <KMKBanner onPlay={() => navigate('/auth')} />

            {/* CTA */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-4">
                გაიარე რეგისტრაცია და ითამაშე უფასოდ
              </p>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 hover:from-pink-400 hover:via-purple-400 hover:to-rose-400 text-white font-bold text-base gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                >
                  <ArrowRight className="w-4 h-4" />
                  რეგისტრაცია / შესვლა
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated game flow
  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-destructive">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 pt-20 pb-8">
        <div className="mx-auto max-w-lg">
          {screen === 'gender-select' && (
            <KMKGenderSelect onSelect={handlePreferenceSelect} />
          )}

          {screen === 'playing' && (
            <KMKRound
              round={gameState.currentRound}
              characters={getRoundCharacters(
                gameState.characters,
                gameState.currentRound
              )}
              onComplete={handleRoundComplete}
              onStartOver={handleReplay}
            />
          )}

          {screen === 'results' && (
            <KMKResults results={gameState.results} onReplay={handleReplay} />
          )}
        </div>
      </main>
    </div>
  );
}
