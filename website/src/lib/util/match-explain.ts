/**
 * 추천 근거(설명) 생성 — "LLM 은 생성, 알고리즘이 고른다" 를 사용자에게 드러낸다.
 *
 * **사용자가 실제로 말한 맛 축만** 근거로 삼는다. 추론된 프로파일이 아니라 발화(메시지)
 * 기준이라, 언급도 안 한 축을 "취향에 맞다" 고 꾸며 말하지 않는다(근거 없는 사유 방지).
 * 언급한 축이 없거나 그 축이 잘 안 맞으면 빈 문자열을 반환해 근거 줄 자체를 숨긴다.
 */

import { type CupDim } from '$lib/algorithms/score';
import type { TasteProfile } from '$lib/types/taste';
import type { Locale } from '$lib/util/locale';

const CUP_DIMS: CupDim[] = ['acidity', 'body', 'sweetness', 'bitterness'];

const AXIS_LABEL: Record<CupDim, { ko: string; en: string }> = {
	acidity: { ko: '산미', en: 'acidity' },
	body: { ko: '바디', en: 'body' },
	sweetness: { ko: '단맛', en: 'sweetness' },
	bitterness: { ko: '쓴맛', en: 'bitterness' }
};

// 사용자가 메시지에서 그 축을 실제로 언급했는지 — 보수적으로 잡아 과잉 귀속을 피한다.
const AXIS_MENTION: Record<CupDim, RegExp> = {
	acidity: /산미|신맛|시큼|새콤|상큼|acid|sour|tart/i,
	body: /바디|묵직|무거운|가벼운|풀\s*바디|body/i,
	sweetness: /단맛|달콤|달달|당도|스위트|sweet|sugary/i,
	bitterness: /쓴맛|쓴|쌉|씁|bitter/i
};

/**
 * 사용자가 말한 맛 축 가운데 후보 예상치와 잘 맞는(차이 ≤1) 축만 짚어 근거 한 줄을 만든다.
 * 적합도% 는 "사용자가 말한 축" 에 대한 평균 유사도다. 언급 축이 없거나 맞는 축이 없으면 '' .
 */
export function explainCupMatch(
	cup: Record<CupDim, number>,
	profile: TasteProfile,
	message: string,
	locale: Locale
): string {
	const en = locale === 'en';
	const mentioned = CUP_DIMS.filter((d) => AXIS_MENTION[d].test(message));
	if (mentioned.length === 0) return '';
	const matched = mentioned.filter((d) => Math.abs(cup[d] - profile[d]) <= 1);
	if (matched.length === 0) return '';

	const fit = Math.round(
		(mentioned.reduce((s, d) => s + (1 - Math.abs(cup[d] - profile[d]) / 4), 0) / mentioned.length) *
			100
	);
	const axes = matched.map((d) => AXIS_LABEL[d][en ? 'en' : 'ko']).join(en ? ', ' : '·');
	if (en) return `Matches your ${axes} preference · ${fit}% fit`;
	const josa = hasFinalConsonant(axes) ? '이' : '가';
	return `${axes}${josa} 취향에 잘 맞아요 · 적합도 ${fit}%`;
}

/** 마지막 글자가 한글 받침을 가지는지 — 조사 '이/가' 선택용. */
function hasFinalConsonant(s: string): boolean {
	const c = s.charCodeAt(s.length - 1);
	if (c < 0xac00 || c > 0xd7a3) return false;
	return (c - 0xac00) % 28 !== 0;
}
