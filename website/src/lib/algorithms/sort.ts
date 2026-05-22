/**
 * Sorting — implemented from scratch (no `Array.prototype.sort`).
 *
 * Used in: ranking scored recipes by fit (descending) and ordering beans by
 * price (ascending). We ship two classics for the coursework writeup:
 *
 *  - mergeSort: STABLE, guaranteed O(n log n). This is the one the recommender
 *    uses for ranking, because ties (equal fit) must preserve the order the LLM
 *    proposed candidates in — stability matters there.
 *  - quickSort: in-place Lomuto-partition variant, average O(n log n). Kept for
 *    comparison / the algorithms showcase; not stable.
 *
 * Both take a `key` extractor and sort ascending by default; pass `desc` to flip.
 */

type KeyFn<T> = (item: T) => number;

/* ----------------------------- Merge sort ------------------------------ */

export function mergeSort<T>(items: readonly T[], key: KeyFn<T>, desc = false): T[] {
	const arr = items.slice();
	if (arr.length <= 1) return arr;
	const mid = Math.floor(arr.length / 2);
	const left = mergeSort(arr.slice(0, mid), key, desc);
	const right = mergeSort(arr.slice(mid), key, desc);
	return merge(left, right, key, desc);
}

function merge<T>(left: T[], right: T[], key: KeyFn<T>, desc: boolean): T[] {
	const out: T[] = [];
	let i = 0;
	let j = 0;
	while (i < left.length && j < right.length) {
		const a = key(left[i]);
		const b = key(right[j]);
		// `<=` keeps it stable: on ties the left (earlier) element goes first.
		const leftFirst = desc ? a >= b : a <= b;
		if (leftFirst) out.push(left[i++]);
		else out.push(right[j++]);
	}
	while (i < left.length) out.push(left[i++]);
	while (j < right.length) out.push(right[j++]);
	return out;
}

/* ----------------------------- Quick sort ------------------------------ */

export function quickSort<T>(items: readonly T[], key: KeyFn<T>, desc = false): T[] {
	const arr = items.slice();
	quickSortInPlace(arr, 0, arr.length - 1, key, desc);
	return arr;
}

function quickSortInPlace<T>(arr: T[], lo: number, hi: number, key: KeyFn<T>, desc: boolean): void {
	if (lo >= hi) return;
	const p = partition(arr, lo, hi, key, desc);
	quickSortInPlace(arr, lo, p - 1, key, desc);
	quickSortInPlace(arr, p + 1, hi, key, desc);
}

function partition<T>(arr: T[], lo: number, hi: number, key: KeyFn<T>, desc: boolean): number {
	const pivot = key(arr[hi]);
	let i = lo;
	for (let j = lo; j < hi; j++) {
		const before = desc ? key(arr[j]) > pivot : key(arr[j]) < pivot;
		if (before) {
			[arr[i], arr[j]] = [arr[j], arr[i]];
			i++;
		}
	}
	[arr[i], arr[hi]] = [arr[hi], arr[i]];
	return i;
}
