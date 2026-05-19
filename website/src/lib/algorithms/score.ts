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
