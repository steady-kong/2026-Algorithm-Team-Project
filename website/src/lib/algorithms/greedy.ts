/**
 * 원두 그리디 추천.
 *
 * 전략:
 *   1) 모든 원두에 적합도를 계산한다.
 *   2) min_match_score 이상이고 (예산이 있다면) 예산 이하인 원두만 후보로 둔다.
 *   3) 100g 환산 가격 오름차순으로 직접 구현한 mergeSort 로 정렬한다.
 *   4) 앞에서부터 top_k 개를 그리디하게 선택한다.
 *
 * 적합도 임계치 제약 하에서 가격 기준 전역 최적을 보장한다.
 */

import { mergeSort } from './sorting';
import { matchScore, pricePer100g } from './score';
import type { Bean, BeanRecommendation } from '../types/bean';
import type { TasteProfile } from '../types/taste';

export interface GreedyOptions {
	topK?: number;
	minMatchScore?: number;
	budgetKrw?: number | null;
}

export function greedyRecommend(
	profile: TasteProfile,
	beans: readonly Bean[],
	opts: GreedyOptions = {}
): BeanRecommendation[] {
	const topK = opts.topK ?? 5;
	const minMatchScore = opts.minMatchScore ?? 0.6;
	const budgetKrw = opts.budgetKrw ?? null;

	const candidates: BeanRecommendation[] = [];
	for (const bean of beans) {
		const score = matchScore(profile, bean);
		if (score < minMatchScore) continue;
		const unitPrice = pricePer100g(bean);
		if (budgetKrw !== null && unitPrice > budgetKrw) continue;
		candidates.push({
			bean,
			match_score: Math.round(score * 10000) / 10000,
			price_per_100g_krw: unitPrice
		});
	}

	const sorted = mergeSort(candidates, {
		key: (r) => r.price_per_100g_krw
	});
	return sorted.slice(0, topK);
}
