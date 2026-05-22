import type { ScoredRecipe } from '$lib/types/recipe';

/**
 * 0/1 Knapsack — dynamic programming, O(n · W).
 *
 * Used in: the "오늘의 시음 세트" (tasting flight) feature. The user has a budget
 * (max total cost). Each recipe has a `cost` (weight) and a fit `score` scaled to
 * a value. We pick the SUBSET that maximises total fit value without exceeding the
 * budget — exactly 0/1 knapsack (each recipe taken at most once).
 *
 * We use the classic bottom-up table dp[i][w] = best value using the first i items
 * with capacity w, then backtrack to recover which recipes were chosen.
 *
 * Scores (0–1 floats) are scaled to integers so the value arithmetic is exact.
 */

export interface KnapsackResult {
	chosen: ScoredRecipe[];
	totalCost: number;
	totalValue: number; // sum of fit scores (0–1) of chosen items
}

const VALUE_SCALE = 1000;

/**
 * Generic 0/1 knapsack core: returns the indices (in input order) of the chosen
 * subset that maximises total value without exceeding `budget`. Float values are
 * scaled to integers so the DP arithmetic is exact. Shared by `knapsackFlight`
 * and the about-page demo so both run the same implementation.
 */
export function knapsack01(items: readonly { cost: number; value: number }[], budget: number): number[] {
	const n = items.length;
	const W = Math.max(0, Math.floor(budget));
	if (n === 0 || W === 0) return [];

	const weights = items.map((it) => Math.max(0, Math.round(it.cost)));
	const values = items.map((it) => Math.round(it.value * VALUE_SCALE));

	// dp[i][w]: max scaled value using items[0..i-1] within capacity w.
	const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(W + 1).fill(0));
	for (let i = 1; i <= n; i++) {
		const wi = weights[i - 1];
		const vi = values[i - 1];
		for (let w = 0; w <= W; w++) {
			dp[i][w] = dp[i - 1][w]; // skip item i
			if (wi <= w) {
				const take = dp[i - 1][w - wi] + vi; // take item i
				if (take > dp[i][w]) dp[i][w] = take;
			}
		}
	}

	// Backtrack to recover the chosen indices.
	const chosen: number[] = [];
	let w = W;
	for (let i = n; i >= 1; i--) {
		if (dp[i][w] !== dp[i - 1][w]) {
			chosen.push(i - 1);
			w -= weights[i - 1];
		}
	}
	chosen.reverse();
	return chosen;
}

export function knapsackFlight(items: readonly ScoredRecipe[], budget: number): KnapsackResult {
	const idx = knapsack01(
		items.map((it) => ({ cost: it.recipe.cost, value: it.score })),
		budget
	);
	const chosen = idx.map((i) => items[i]);
	return {
		chosen,
		totalCost: chosen.reduce((s, c) => s + Math.round(c.recipe.cost), 0),
		totalValue: chosen.reduce((s, c) => s + c.score, 0)
	};
}
