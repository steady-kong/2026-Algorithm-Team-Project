export const TASTE_DIMENSIONS = [
	'acidity',
	'body',
	'sweetness',
	'bitterness',
	'roast_level'
] as const;

export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];

export const TASTE_DIMENSION_LABELS: Record<TasteDimension, string> = {
	acidity: '산미',
	body: '바디감',
	sweetness: '단맛',
	bitterness: '쓴맛',
	roast_level: '로스팅'
};

export type TasteLevel = 1 | 2 | 3 | 4 | 5;

export type TasteProfile = Record<TasteDimension, TasteLevel>;

export const clampLevel = (n: unknown): TasteLevel => {
	const v = typeof n === 'number' ? n : Number(n);
	if (!Number.isFinite(v)) return 3;
	const rounded = Math.round(v);
	if (rounded <= 1) return 1;
	if (rounded >= 5) return 5;
	return rounded as TasteLevel;
};

export const neutralProfile = (): TasteProfile => ({
	acidity: 3,
	body: 3,
	sweetness: 3,
	bitterness: 3,
	roast_level: 3
});

export const isTasteProfile = (v: unknown): v is TasteProfile => {
	if (!v || typeof v !== 'object') return false;
	const o = v as Record<string, unknown>;
	return TASTE_DIMENSIONS.every((d) => {
		const n = o[d];
		return typeof n === 'number' && n >= 1 && n <= 5 && Number.isInteger(n);
	});
};

export const sanitizeProfile = (v: unknown): TasteProfile => {
	const base = neutralProfile();
	if (!v || typeof v !== 'object') return base;
	const o = v as Record<string, unknown>;
	for (const d of TASTE_DIMENSIONS) {
		base[d] = clampLevel(o[d]);
	}
	return base;
};
