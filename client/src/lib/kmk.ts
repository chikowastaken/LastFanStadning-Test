// Kiss Marry Kill - Types and Utilities

export type KMKGender = 'male' | 'female';
export type KMKPreference = 'boy' | 'girl' | 'all';
export type KMKChoice = 'kiss' | 'marry' | 'kill';

export interface KMKCharacter {
  id: string;
  name: string;
  gender: KMKGender;
  image_url: string | null;
}

export interface KMKRoundResult {
  round: number;
  characters: KMKCharacter[];
  choices: Record<string, KMKChoice>; // character_id -> choice
}

export interface KMKGameState {
  preference: KMKPreference | null;
  currentRound: number;
  characters: KMKCharacter[]; // All 15 selected characters for 5 rounds
  results: KMKRoundResult[];
}

// Utility: shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Utility: filter characters by user preference
export function filterByPreference(
  characters: KMKCharacter[],
  preference: KMKPreference
): KMKCharacter[] {
  if (preference === 'all') return characters;
  // Boy sees women, girl sees men
  const targetGender: KMKGender = preference === 'boy' ? 'female' : 'male';
  return characters.filter((c) => c.gender === targetGender);
}

// Utility: select 15 random characters for 5 rounds
export function selectGameCharacters(
  characters: KMKCharacter[],
  preference: KMKPreference
): KMKCharacter[] {
  const filtered = filterByPreference(characters, preference);
  const shuffled = shuffleArray(filtered);
  // Need 15 characters (5 rounds x 3 each)
  // If not enough, repeat some (shouldn't happen with 24+ per gender)
  if (shuffled.length >= 15) {
    return shuffled.slice(0, 15);
  }
  // Fallback: repeat characters if pool is too small
  const result: KMKCharacter[] = [];
  while (result.length < 15) {
    result.push(...shuffled);
  }
  return shuffleArray(result).slice(0, 15);
}

// Utility: get characters for a specific round
export function getRoundCharacters(
  allCharacters: KMKCharacter[],
  round: number
): KMKCharacter[] {
  const startIndex = (round - 1) * 3;
  return allCharacters.slice(startIndex, startIndex + 3);
}

// Choice emoji mapping
export const CHOICE_EMOJI: Record<KMKChoice, string> = {
  kiss: '💋',
  marry: '💍',
  kill: '💀',
};

// Choice labels in Georgian
export const CHOICE_LABELS: Record<KMKChoice, string> = {
  kiss: 'Kiss',
  marry: 'Marry',
  kill: 'Kill',
};

// Initial game state
export const INITIAL_GAME_STATE: KMKGameState = {
  preference: null,
  currentRound: 0,
  characters: [],
  results: [],
};

// Total rounds in a game
export const TOTAL_ROUNDS = 5;
