/**
 * Taste model — four sensory axes, each a discrete 1–5 score.
 * These are the dimensions the user steers: 신맛 / 단맛 / 쓴맛 / 바디감.
 */

export const TASTE_AXES = ['acidity', 'sweetness', 'bitterness', 'body'] as const;
export type TasteAxis = (typeof TASTE_AXES)[number];

export type TasteProfile = Record<TasteAxis, number>;

/** Korean labels for UI. */
export const AXIS_LABEL: Record<TasteAxis, string> = {
	acidity: '신맛',
	sweetness: '단맛',
	bitterness: '쓴맛',
	body: '바디감'
};

export const AXIS_MIN = 1;
export const AXIS_MAX = 5;

/** Clamp a single axis value into the valid 1–5 integer range. */
export function clampAxis(value: number): number {
	const r = Math.round(value);
	if (r < AXIS_MIN) return AXIS_MIN;
	if (r > AXIS_MAX) return AXIS_MAX;
	return r;
}

/** Clamp every axis of a profile. */
export function clampProfile(p: TasteProfile): TasteProfile {
	return {
		acidity: clampAxis(p.acidity),
		sweetness: clampAxis(p.sweetness),
		bitterness: clampAxis(p.bitterness),
		body: clampAxis(p.body)
	};
}

/** A neutral middle-of-the-road profile, used as the starting target. */
export function neutralProfile(): TasteProfile {
	return { acidity: 3, sweetness: 3, bitterness: 3, body: 3 };
}

/** Apply a signed delta to a profile (used when refining a preference). */
export function applyDelta(base: TasteProfile, delta: Partial<TasteProfile>): TasteProfile {
	return clampProfile({
		acidity: base.acidity + (delta.acidity ?? 0),
		sweetness: base.sweetness + (delta.sweetness ?? 0),
		bitterness: base.bitterness + (delta.bitterness ?? 0),
		body: base.body + (delta.body ?? 0)
	});
}

/** Type guard for untrusted (e.g. LLM-produced) profile data. */
export function isTasteProfile(v: unknown): v is TasteProfile {
	if (typeof v !== 'object' || v === null) return false;
	const o = v as Record<string, unknown>;
	return TASTE_AXES.every((a) => typeof o[a] === 'number');
}
