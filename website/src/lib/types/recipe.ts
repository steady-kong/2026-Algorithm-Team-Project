import type { TasteProfile } from './taste';

/** Brewing methods the recommender knows about. */
export const BREW_METHODS = [
	'espresso',
	'pour_over',
	'french_press',
	'cold_brew',
	'aeropress',
	'moka_pot',
	'latte'
] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export const BREW_LABEL: Record<BrewMethod, string> = {
	espresso: '에스프레소',
	pour_over: '핸드드립',
	french_press: '프렌치프레스',
	cold_brew: '콜드브루',
	aeropress: '에어로프레스',
	moka_pot: '모카포트',
	latte: '라떼'
};

export const ROAST_LEVELS = ['light', 'medium', 'medium_dark', 'dark'] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export const ROAST_LABEL: Record<RoastLevel, string> = {
	light: '라이트',
	medium: '미디엄',
	medium_dark: '미디엄다크',
	dark: '다크'
};

export interface Bean {
	origin: string; // e.g. "에티오피아 예가체프"
	roast: RoastLevel;
}

/**
 * A single coffee recipe candidate.
 *
 * `cost` and `effort` feed the knapsack/greedy algorithms — `cost` is a relative
 * price unit (beans + milk + extras) and `effort` is brew difficulty/time weight.
 */
export interface CoffeeRecipe {
	id: string;
	name: string; // English/handle
	nameKo: string;
	bean: Bean;
	method: BrewMethod;
	profile: TasteProfile;
	cost: number; // relative price units (for budgeted selection)
	effort: number; // 1–5 brew difficulty
	brewTimeMin: number;
	steps: string[];
	story?: string; // a one-liner talking point
}

/** A recipe paired with the score an algorithm assigned it. */
export interface ScoredRecipe {
	recipe: CoffeeRecipe;
	score: number; // 0–1 fit against the target profile
}

export function isBrewMethod(v: unknown): v is BrewMethod {
	return typeof v === 'string' && (BREW_METHODS as readonly string[]).includes(v);
}

export function isRoastLevel(v: unknown): v is RoastLevel {
	return typeof v === 'string' && (ROAST_LEVELS as readonly string[]).includes(v);
}
