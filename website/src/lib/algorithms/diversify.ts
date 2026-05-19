/**
 * 다양성(diversity) 재배치 — 그리디.
 *
 * 정렬된 후보 리스트를 받아 같은 그룹(예: menu_category) 이 연속해서 나오지 않게
 * top-K 안에서 swap 한다. 정렬 순서는 가능한 한 보존(=점수 손실 최소화)하되,
 * 인접 중복은 다음 그룹 후보로 끌어올린다.
 *
 * 알고리즘 컨셉:
 *   for i in 0..K:
 *     if items[i] 가 items[i-1] 과 같은 그룹이면
 *       i+1.. 에서 다른 그룹의 첫 후보 j 를 찾아 swap.
 *       (없으면 그대로 둔다 — 단일 그룹이면 어쩔 수 없음.)
 *
 * 단순 그리디라 O(K·N).
 */

export interface DiversifyOptions<T> {
	groupKey: (item: T) => string | undefined;
	topK: number;
}

export function diversify<T>(items: readonly T[], opts: DiversifyOptions<T>): T[] {
	const out = items.slice();
	const k = Math.min(opts.topK, out.length);
	for (let i = 1; i < k; i++) {
		const prev = opts.groupKey(out[i - 1]);
		const here = opts.groupKey(out[i]);
		if (prev === undefined || here === undefined) continue;
		if (prev !== here) continue;
		// 뒤에서 다른 그룹 후보를 찾아 swap.
		let swapIdx = -1;
		for (let j = i + 1; j < out.length; j++) {
			const cand = opts.groupKey(out[j]);
			if (cand !== undefined && cand !== prev) {
				swapIdx = j;
				break;
			}
		}
		if (swapIdx !== -1) {
			[out[i], out[swapIdx]] = [out[swapIdx], out[i]];
		}
	}
	return out;
}
