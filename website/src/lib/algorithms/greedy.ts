import type { ScoredRecipe } from '$lib/types/recipe';

/**
 * Greedy selection.
 *
 * Used in: turning a ranked candidate list into the final 3 cards shown to the
 * user. A naive "top-3 by score" tends to return three near-identical drinks
 * (e.g. three lattes). `diversify` greedily walks the ranked list and skips a
 * candidate whose brew method already appears in the chosen set until it has to
 * relax — maximising variety while staying as high-scoring as possible.
 *
 * This is the classic greedy "local best that doesn't violate a constraint"
 * heuristic: at each step take the highest remaining score whose method is new.
 *
 * Complexity: O(n) over the already-sorted list (two passes).
 */
export function diversify(ranked: readonly ScoredRecipe[], k: number): ScoredRecipe[] {
	const chosen: ScoredRecipe[] = [];
	const usedMethods = new Set<string>();

	// Pass 1: greedily take the best of each not-yet-seen method.
	for (const sr of ranked) {
		if (chosen.length >= k) break;
		if (!usedMethods.has(sr.recipe.method)) {
			chosen.push(sr);
			usedMethods.add(sr.recipe.method);
		}
	}
	// Pass 2: if methods ran out before we hit k, backfill with next-best leftovers.
	if (chosen.length < k) {
		const picked = new Set(chosen.map((c) => c.recipe.id));
		for (const sr of ranked) {
			if (chosen.length >= k) break;
			if (!picked.has(sr.recipe.id)) chosen.push(sr);
		}
	}
	return chosen;
}

/**
 * Greedy threshold filter: keep only candidates at/above a fit threshold,
 * then take the cheapest `k` of them. Used by the bean/value picker.
 * Assumes input is already cost-ascending so the slice is the cheapest.
 */
export function affordableTopK(
	costAscending: readonly ScoredRecipe[],
	minScore: number,
	k: number
): ScoredRecipe[] {
	const out: ScoredRecipe[] = [];
	for (const sr of costAscending) {
		if (out.length >= k) break;
		if (sr.score >= minScore) out.push(sr);
	}
	return out;
}
