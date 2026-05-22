import type { CoffeeRecipe } from '$lib/types/recipe';
import { tasteDistance } from './similarity';

/**
 * Taste-space graph + Dijkstra shortest path (with a from-scratch binary heap).
 *
 * Used in: the "취향 여정" (taste journey). We model recipes as nodes in a graph;
 * two recipes are connected if their taste profiles are within `maxEdgeDistance`
 * L1 units of each other, with edge weight = that distance. To move a user from
 * the drink they currently like toward the drink that best matches their refined
 * target, we run Dijkstra to find the smoothest path — a sequence of small,
 * incremental taste changes rather than one jarring jump. The /about page animates
 * this traversal.
 *
 * - buildTasteGraph: O(n²) edge construction (n = recipe count, small).
 * - dijkstra: O((V + E) log V) using the binary min-heap below.
 */

export interface Edge {
	to: number; // node index
	weight: number;
}
export type TasteGraph = Edge[][]; // adjacency list keyed by recipe index

export function buildTasteGraph(recipes: readonly CoffeeRecipe[], maxEdgeDistance = 3): TasteGraph {
	const n = recipes.length;
	const adj: TasteGraph = Array.from({ length: n }, () => []);
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			const d = tasteDistance(recipes[i].profile, recipes[j].profile);
			if (d <= maxEdgeDistance) {
				adj[i].push({ to: j, weight: d });
				adj[j].push({ to: i, weight: d });
			}
		}
	}
	return adj;
}

export interface DijkstraResult {
	dist: number;
	path: number[]; // node indices from start to goal inclusive; [] if unreachable
}

export function dijkstra(graph: TasteGraph, start: number, goal: number): DijkstraResult {
	const n = graph.length;
	const dist = new Array<number>(n).fill(Infinity);
	const prev = new Array<number>(n).fill(-1);
	dist[start] = 0;

	const heap = new MinHeap();
	heap.push(start, 0);

	while (!heap.isEmpty()) {
		const { node: u, priority: d } = heap.pop()!;
		if (d > dist[u]) continue; // stale entry
		if (u === goal) break;
		for (const { to, weight } of graph[u]) {
			const nd = dist[u] + weight;
			if (nd < dist[to]) {
				dist[to] = nd;
				prev[to] = u;
				heap.push(to, nd);
			}
		}
	}

	if (dist[goal] === Infinity) return { dist: Infinity, path: [] };

	const path: number[] = [];
	for (let at = goal; at !== -1; at = prev[at]) path.push(at);
	path.reverse();
	return { dist: dist[goal], path };
}

/* ---------------------- binary min-heap (from scratch) ---------------------- */

interface HeapEntry {
	node: number;
	priority: number;
}

export class MinHeap {
	private heap: HeapEntry[] = [];

	isEmpty(): boolean {
		return this.heap.length === 0;
	}

	push(node: number, priority: number): void {
		this.heap.push({ node, priority });
		this.bubbleUp(this.heap.length - 1);
	}

	pop(): HeapEntry | undefined {
		const h = this.heap;
		if (h.length === 0) return undefined;
		const top = h[0];
		const last = h.pop()!;
		if (h.length > 0) {
			h[0] = last;
			this.bubbleDown(0);
		}
		return top;
	}

	private bubbleUp(i: number): void {
		const h = this.heap;
		while (i > 0) {
			const parent = (i - 1) >> 1;
			if (h[parent].priority <= h[i].priority) break;
			[h[parent], h[i]] = [h[i], h[parent]];
			i = parent;
		}
	}

	private bubbleDown(i: number): void {
		const h = this.heap;
		const n = h.length;
		for (;;) {
			const l = 2 * i + 1;
			const r = 2 * i + 2;
			let smallest = i;
			if (l < n && h[l].priority < h[smallest].priority) smallest = l;
			if (r < n && h[r].priority < h[smallest].priority) smallest = r;
			if (smallest === i) break;
			[h[smallest], h[i]] = [h[i], h[smallest]];
			i = smallest;
		}
	}
}
