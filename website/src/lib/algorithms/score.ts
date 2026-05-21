/**
 * 취향 적합도 계산.
 *
 * 5개 차원(산미·바디·단맛·쓴맛·로스팅) 각각의 절대 차이를 최대값 4 로 나눠
 * 정규화한 유사도(1 - diff/4)의 평균을 낸다. 결과는 0~1.
 */

import { TASTE_DIMENSIONS, type TasteProfile } from '../types/taste';
import type { Bean } from '../types/bean';

const beanLevels = (bean: Bean) => ({
	acidity: bean.acidity,
	body: bean.body,
	sweetness: bean.sweetness,
	bitterness: bean.bitterness,
	roast_level: bean.roast_level
});

export function matchScore(profile: TasteProfile, bean: Bean): number {
	const b = beanLevels(bean);
	let total = 0;
	for (const dim of TASTE_DIMENSIONS) {
		const diff = Math.abs(profile[dim] - b[dim]);
		total += 1 - diff / 4;
	}
	return total / TASTE_DIMENSIONS.length;
}

/**
 * 두 5축 취향 프로파일 간 유사도(0~1). `matchScore` 와 동일하게 각 축 절대 차이를
 * 최대 4 로 정규화한 평균. LLM 이 생성한 후보의 예상 5축 벡터를 사용자 목표 취향과
 * 비교해 적합도 순으로 정렬할 때 쓴다 (plan.md §50 — LLM 후보 → 알고리즘 랭킹).
 */
export function profileMatchScore(target: TasteProfile, candidate: TasteProfile): number {
	let total = 0;
	for (const dim of TASTE_DIMENSIONS) {
		const diff = Math.abs(target[dim] - candidate[dim]);
		total += 1 - diff / 4;
	}
	return total / TASTE_DIMENSIONS.length;
}

const CUP_DIMS = ['acidity', 'body', 'sweetness', 'bitterness'] as const;
export type CupDim = (typeof CUP_DIMS)[number];

export function cupMatchScore(
	cup: Record<CupDim, number>,
	profile: TasteProfile
): number {
	let total = 0;
	for (const dim of CUP_DIMS) {
		const diff = Math.abs(cup[dim] - profile[dim]);
		total += 1 - diff / 4;
	}
	return total / CUP_DIMS.length;
}

export function pricePer100g(bean: Bean): number {
	if (bean.weight_g <= 0) return bean.price_krw;
	return Math.round((bean.price_krw * 100) / bean.weight_g);
}
