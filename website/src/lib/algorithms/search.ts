/**
 * Binary search — from scratch, O(log n).
 *
 * Used in: the "price ladder" feature. Given recipes already sorted ascending by
 * cost, we binary-search the index of the first recipe whose cost exceeds the
 * user's budget, giving an instant affordable/over-budget split without a linear
 * scan. Also reused by knapsack pre-filtering.
 *
 * `lowerBound` returns the first index `i` where `key(sorted[i]) >= target`
 * (insertion point), matching C++ std::lower_bound semantics.
 */

export function lowerBound<T>(sorted: readonly T[], target: number, key: (t: T) => number): number {
	let lo = 0;
	let hi = sorted.length; // [lo, hi)
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (key(sorted[mid]) < target) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

/** First index whose key is strictly greater than target (upper_bound). */
export function upperBound<T>(sorted: readonly T[], target: number, key: (t: T) => number): number {
	let lo = 0;
	let hi = sorted.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (key(sorted[mid]) <= target) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}
