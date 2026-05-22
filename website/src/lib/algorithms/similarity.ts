import { TASTE_AXES, type TasteProfile, type TasteAxis } from '$lib/types/taste';

/**
 * Taste similarity scoring.
 *
 * Used in: every ranking pass — converts the distance between a candidate's
 * profile and the user's target profile into a 0–1 "fit" score that all the
 * downstream algorithms (sort / greedy / knapsack) consume as their key.
 *
 * Method: weighted Manhattan distance over the four 1–5 axes, normalised by the
 * maximum possible distance, then inverted so 1 = perfect match, 0 = opposite.
 * Manhattan (L1) is used over Euclidean because the axes are independent ordinal
 * scales — a 2-point miss on one axis should count the same as 1+1 across two.
 *
 * Complexity: O(A) per comparison where A = number of axes (constant 4).
 */

export type AxisWeights = Partial<Record<TasteAxis, number>>;

const MAX_AXIS_DELTA = 4; // |5 - 1|

export function matchScore(
	candidate: TasteProfile,
	target: TasteProfile,
	weights: AxisWeights = {}
): number {
	let weightedDistance = 0;
	let weightSum = 0;
	for (const axis of TASTE_AXES) {
		const w = weights[axis] ?? 1;
		weightedDistance += w * Math.abs(candidate[axis] - target[axis]);
		weightSum += w;
	}
	if (weightSum === 0) return 0;
	const normalised = weightedDistance / (weightSum * MAX_AXIS_DELTA); // 0..1, 0 = identical
	return 1 - normalised;
}

/** Raw L1 distance — handy for the graph edges in graph.ts. */
export function tasteDistance(a: TasteProfile, b: TasteProfile): number {
	let d = 0;
	for (const axis of TASTE_AXES) d += Math.abs(a[axis] - b[axis]);
	return d;
}
