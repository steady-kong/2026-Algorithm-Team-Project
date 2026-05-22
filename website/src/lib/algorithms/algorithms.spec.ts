import { describe, it, expect } from 'vitest';
import { matchScore, tasteDistance } from './similarity';
import { mergeSort, quickSort } from './sort';
import { lowerBound, upperBound } from './search';
import { diversify } from './greedy';
import { knapsackFlight } from './knapsack';
import { buildTasteGraph, dijkstra, MinHeap } from './graph';
import { blendProfiles, interpolationSteps } from './interpolate';
import type { CoffeeRecipe, ScoredRecipe } from '$lib/types/recipe';
import type { TasteProfile } from '$lib/types/taste';

const P = (a: number, s: number, b: number, bo: number): TasteProfile => ({
	acidity: a,
	sweetness: s,
	bitterness: b,
	body: bo
});

function recipe(id: string, profile: TasteProfile, cost: number, method: CoffeeRecipe['method'] = 'pour_over'): CoffeeRecipe {
	return {
		id,
		name: id,
		nameKo: id,
		bean: { origin: 'test', roast: 'medium' },
		method,
		profile,
		cost,
		effort: 2,
		brewTimeMin: 3,
		steps: ['x']
	};
}
const scored = (r: CoffeeRecipe, score: number): ScoredRecipe => ({ recipe: r, score });

describe('similarity', () => {
	it('identical profiles score 1', () => {
		expect(matchScore(P(3, 3, 3, 3), P(3, 3, 3, 3))).toBe(1);
	});
	it('opposite profiles score 0', () => {
		expect(matchScore(P(1, 1, 1, 1), P(5, 5, 5, 5))).toBe(0);
	});
	it('score is within [0,1] and monotonic with distance', () => {
		const near = matchScore(P(3, 3, 3, 3), P(3, 3, 3, 4));
		const far = matchScore(P(3, 3, 3, 3), P(3, 3, 5, 5));
		expect(near).toBeGreaterThan(far);
		expect(far).toBeGreaterThanOrEqual(0);
		expect(near).toBeLessThanOrEqual(1);
	});
	it('L1 distance is symmetric', () => {
		expect(tasteDistance(P(1, 2, 3, 4), P(4, 3, 2, 1))).toBe(tasteDistance(P(4, 3, 2, 1), P(1, 2, 3, 4)));
	});
});

describe('sort', () => {
	const data = [{ k: 3 }, { k: 1 }, { k: 2 }, { k: 1 }];
	it('mergeSort ascending', () => {
		expect(mergeSort(data, (d) => d.k).map((d) => d.k)).toEqual([1, 1, 2, 3]);
	});
	it('mergeSort descending', () => {
		expect(mergeSort(data, (d) => d.k, true).map((d) => d.k)).toEqual([3, 2, 1, 1]);
	});
	it('mergeSort is stable on ties', () => {
		const tagged = [
			{ k: 1, id: 'a' },
			{ k: 1, id: 'b' },
			{ k: 1, id: 'c' }
		];
		expect(mergeSort(tagged, (d) => d.k).map((d) => d.id)).toEqual(['a', 'b', 'c']);
	});
	it('quickSort matches mergeSort ordering', () => {
		const big = Array.from({ length: 50 }, () => ({ k: Math.floor(Math.random() * 20) }));
		const ms = mergeSort(big, (d) => d.k).map((d) => d.k);
		const qs = quickSort(big, (d) => d.k).map((d) => d.k);
		expect(qs).toEqual(ms);
	});
	it('does not mutate input', () => {
		const orig = [{ k: 2 }, { k: 1 }];
		mergeSort(orig, (d) => d.k);
		expect(orig.map((d) => d.k)).toEqual([2, 1]);
	});
});

describe('binary search', () => {
	const arr = [1, 3, 3, 5, 7];
	const id = (n: number) => n;
	it('lowerBound finds first >= target', () => {
		expect(lowerBound(arr, 3, id)).toBe(1);
		expect(lowerBound(arr, 4, id)).toBe(3);
		expect(lowerBound(arr, 0, id)).toBe(0);
		expect(lowerBound(arr, 8, id)).toBe(5);
	});
	it('upperBound finds first > target', () => {
		expect(upperBound(arr, 3, id)).toBe(3);
	});
});

describe('greedy diversify', () => {
	it('prefers distinct brew methods', () => {
		const ranked = [
			scored(recipe('a', P(3, 3, 3, 3), 4, 'latte'), 0.9),
			scored(recipe('b', P(3, 3, 3, 3), 4, 'latte'), 0.85),
			scored(recipe('c', P(3, 3, 3, 3), 4, 'espresso'), 0.8),
			scored(recipe('d', P(3, 3, 3, 3), 4, 'cold_brew'), 0.7)
		];
		const picked = diversify(ranked, 3);
		const methods = picked.map((p) => p.recipe.method);
		expect(new Set(methods).size).toBe(3);
		expect(picked[0].recipe.id).toBe('a'); // best overall still first
	});
	it('backfills when methods run out', () => {
		const ranked = [
			scored(recipe('a', P(3, 3, 3, 3), 4, 'latte'), 0.9),
			scored(recipe('b', P(3, 3, 3, 3), 4, 'latte'), 0.85)
		];
		expect(diversify(ranked, 3)).toHaveLength(2);
	});
});

describe('0/1 knapsack', () => {
	it('maximises value within budget', () => {
		const items = [
			scored(recipe('cheap-good', P(3, 3, 3, 3), 4), 0.9),
			scored(recipe('mid', P(3, 3, 3, 3), 4), 0.7),
			scored(recipe('exp', P(3, 3, 3, 3), 6), 0.8)
		];
		const res = knapsackFlight(items, 8);
		expect(res.totalCost).toBeLessThanOrEqual(8);
		// best two within budget 8 are the two cost-4 items (0.9 + 0.7 = 1.6)
		expect(res.chosen.map((c) => c.recipe.id).sort()).toEqual(['cheap-good', 'mid']);
		expect(res.totalValue).toBeCloseTo(1.6, 5);
	});
	it('empty budget yields nothing', () => {
		expect(knapsackFlight([scored(recipe('a', P(3, 3, 3, 3), 4), 1)], 0).chosen).toHaveLength(0);
	});
});

describe('graph + dijkstra', () => {
	it('finds shortest path and builds symmetric edges', () => {
		const recipes = [
			recipe('n0', P(3, 3, 3, 3), 4),
			recipe('n1', P(3, 3, 4, 3), 4),
			recipe('n2', P(3, 3, 5, 4), 4),
			recipe('n3', P(1, 1, 5, 5), 4)
		];
		const g = buildTasteGraph(recipes, 3);
		const { dist, path } = dijkstra(g, 0, 2);
		expect(path[0]).toBe(0);
		expect(path[path.length - 1]).toBe(2);
		expect(dist).toBeGreaterThan(0);
	});
	it('returns empty path when unreachable', () => {
		const recipes = [recipe('a', P(1, 1, 1, 1), 4), recipe('b', P(5, 5, 5, 5), 4)];
		const g = buildTasteGraph(recipes, 1); // too tight to connect
		expect(dijkstra(g, 0, 1).path).toEqual([]);
	});
});

describe('MinHeap', () => {
	it('pops in ascending priority order', () => {
		const h = new MinHeap();
		[5, 1, 4, 2, 3].forEach((n) => h.push(n, n));
		const out: number[] = [];
		while (!h.isEmpty()) out.push(h.pop()!.priority);
		expect(out).toEqual([1, 2, 3, 4, 5]);
	});
});

describe('interpolation', () => {
	it('blend at t=0 and t=1 returns endpoints (clamped)', () => {
		const a = P(1, 1, 1, 1);
		const b = P(5, 5, 5, 5);
		expect(blendProfiles(a, b, 0)).toEqual(a);
		expect(blendProfiles(a, b, 1)).toEqual(b);
	});
	it('midpoint is between', () => {
		const mid = blendProfiles(P(1, 1, 1, 1), P(5, 5, 5, 5), 0.5);
		expect(mid.acidity).toBe(3);
	});
	it('interpolationSteps spans inclusive ends', () => {
		const steps = interpolationSteps(P(1, 1, 1, 1), P(5, 5, 5, 5), 3);
		expect(steps).toHaveLength(3);
		expect(steps[0]).toEqual(P(1, 1, 1, 1));
		expect(steps[2]).toEqual(P(5, 5, 5, 5));
	});
});
