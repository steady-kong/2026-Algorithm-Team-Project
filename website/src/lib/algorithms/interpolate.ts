import { TASTE_AXES, clampProfile, type TasteProfile } from '$lib/types/taste';

/**
 * Linear interpolation (blend) between two taste profiles.
 *
 * Used in: the "둘을 섞은 느낌" (blend two drinks) action and, internally, to
 * synthesise intermediate target profiles along the Dijkstra taste journey so the
 * animation can morph smoothly between nodes.
 *
 * blend(a, b, t) = a·(1−t) + b·t, axis-wise, clamped back to the 1–5 grid.
 * Complexity: O(A).
 */
export function blendProfiles(a: TasteProfile, b: TasteProfile, t: number): TasteProfile {
	const clampedT = Math.min(1, Math.max(0, t));
	const out = {} as TasteProfile;
	for (const axis of TASTE_AXES) {
		out[axis] = a[axis] * (1 - clampedT) + b[axis] * clampedT;
	}
	return clampProfile(out);
}

/** Evenly spaced interpolation steps between two profiles (inclusive ends). */
export function interpolationSteps(a: TasteProfile, b: TasteProfile, steps: number): TasteProfile[] {
	if (steps <= 1) return [clampProfile(b)];
	const out: TasteProfile[] = [];
	for (let i = 0; i < steps; i++) out.push(blendProfiles(a, b, i / (steps - 1)));
	return out;
}
