/**
 * 정렬 알고리즘 from-scratch 구현.
 *
 * 표준 라이브러리의 Array.prototype.sort 를 사용하지 않고 직접 구현한다.
 * - mergeSort: 안정 정렬, O(n log n) 보장. 동률 후보 순서 보존이 필요할 때.
 * - quickSort: Lomuto 파티션, 평균 O(n log n). 보조 비교용.
 */

export interface SortOptions<T> {
	key?: (item: T) => number;
	reverse?: boolean;
}

const identityKey = <T>(x: T): number => x as unknown as number;

export function mergeSort<T>(items: readonly T[], opts: SortOptions<T> = {}): T[] {
	const arr = items.slice();
	if (arr.length <= 1) return arr;
	const keyFn = opts.key ?? identityKey;
	const reverse = opts.reverse ?? false;
	mergeSortInPlace(arr, 0, arr.length, keyFn, reverse);
	return arr;
}

function mergeSortInPlace<T>(
	arr: T[],
	lo: number,
	hi: number,
	keyFn: (x: T) => number,
	reverse: boolean
): void {
	if (hi - lo <= 1) return;
	const mid = (lo + hi) >> 1;
	mergeSortInPlace(arr, lo, mid, keyFn, reverse);
	mergeSortInPlace(arr, mid, hi, keyFn, reverse);
	merge(arr, lo, mid, hi, keyFn, reverse);
}

function merge<T>(
	arr: T[],
	lo: number,
	mid: number,
	hi: number,
	keyFn: (x: T) => number,
	reverse: boolean
): void {
	const left = arr.slice(lo, mid);
	const right = arr.slice(mid, hi);
	let i = 0;
	let j = 0;
	let k = lo;
	while (i < left.length && j < right.length) {
		const lk = keyFn(left[i]);
		const rk = keyFn(right[j]);
		// 안정성 보존: 동률이면 left 먼저.
		const takeLeft = reverse ? lk > rk : lk <= rk;
		if (takeLeft) {
			arr[k++] = left[i++];
		} else {
			arr[k++] = right[j++];
		}
	}
	while (i < left.length) arr[k++] = left[i++];
	while (j < right.length) arr[k++] = right[j++];
}

export function quickSort<T>(items: readonly T[], opts: SortOptions<T> = {}): T[] {
	const arr = items.slice();
	if (arr.length <= 1) return arr;
	const keyFn = opts.key ?? identityKey;
	const reverse = opts.reverse ?? false;
	quickSortInPlace(arr, 0, arr.length - 1, keyFn, reverse);
	return arr;
}

function quickSortInPlace<T>(
	arr: T[],
	lo: number,
	hi: number,
	keyFn: (x: T) => number,
	reverse: boolean
): void {
	if (lo >= hi) return;
	const p = partition(arr, lo, hi, keyFn, reverse);
	quickSortInPlace(arr, lo, p - 1, keyFn, reverse);
	quickSortInPlace(arr, p + 1, hi, keyFn, reverse);
}

function partition<T>(
	arr: T[],
	lo: number,
	hi: number,
	keyFn: (x: T) => number,
	reverse: boolean
): number {
	const pivot = keyFn(arr[hi]);
	let i = lo - 1;
	for (let j = lo; j < hi; j++) {
		const kj = keyFn(arr[j]);
		const cond = reverse ? kj > pivot : kj <= pivot;
		if (cond) {
			i++;
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}
	[arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
	return i + 1;
}
