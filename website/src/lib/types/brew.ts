export const BREW_METHODS = [
	'hand_drip',
	'moka_pot',
	'espresso_machine',
	'aeropress',
	'french_press'
] as const;

export type BrewMethod = (typeof BREW_METHODS)[number];

export const BREW_METHOD_LABELS: Record<BrewMethod, string> = {
	hand_drip: '핸드드립',
	moka_pot: '모카포트',
	espresso_machine: '에스프레소 머신',
	aeropress: '에어로프레스',
	french_press: '프렌치프레스'
};

export const isBrewMethod = (v: unknown): v is BrewMethod =>
	typeof v === 'string' && (BREW_METHODS as readonly string[]).includes(v);
