/**
 * 취향 텍스트의 규칙 기반 폴백 파서.
 *
 * Upstage API 키가 없거나 LLM 호출이 실패해도 차원별 키워드 휴리스틱으로
 * 1~5 점수를 매겨 파이프라인을 끊지 않는다.
 */

import { TASTE_DIMENSIONS, type TasteLevel, type TasteProfile } from '../types/taste';

const DIM_KEYWORDS: Record<Exclude<(typeof TASTE_DIMENSIONS)[number], 'roast_level'>, readonly string[]> = {
	acidity: ['산미', '신맛', '산뜻', '상큼', '새콤', '프루티', '과일향', '과일'],
	body: ['바디', '묵직', '무게감', '진득', '걸쭉', '두께감'],
	sweetness: ['단맛', '달콤', '달달', '스위트', '당도'],
	bitterness: ['쓴맛', '쌉쌀', '쓰게', '씁쓸']
};

const LOW_STRONG = ['전혀', '하나도'];
const MILD = ['약간', '살짝', '조금', '적당', '중간', '보통'];
const LOW = ['낮', '약', '적', '없', '연하', '부드럽', '싫', '별로', '덜', '빼', '은은'];
const HIGH_STRONG = ['매우', '아주', '엄청', '굉장', '완전', '최고', '제일', '많이', '강하게'];
const HIGH = ['높', '강', '진하', '풍부', '가득', '듬뿍', '좋', '있', '원하', '선호', '뚜렷', '확실'];

const ROAST_KEYWORDS: ReadonlyArray<readonly [readonly string[], TasteLevel]> = [
	[['강배전', '다크 로스트', '다크로스트', '프렌치 로스트', '다크'], 5],
	[['중강배전', '풀시티', '풀 시티'], 4],
	[['중배전', '미디엄', '시티 로스트', '시티로스트'], 3],
	[['중약배전', '하이 로스트'], 2],
	[['약배전', '라이트 로스트', '라이트로스트', '라이트', '시나몬 로스트'], 1]
];

const WINDOW = 12;

const LEVEL_LABEL: Record<TasteLevel, string> = {
	1: '매우 약함',
	2: '약함',
	3: '보통',
	4: '강함',
	5: '매우 강함'
};

function inferLevel(window: string): TasteLevel {
	if (LOW_STRONG.some((w) => window.includes(w))) return 1;
	if (MILD.some((w) => window.includes(w))) return 3;
	if (LOW.some((w) => window.includes(w))) return 2;
	if (HIGH_STRONG.some((w) => window.includes(w))) return 5;
	if (HIGH.some((w) => window.includes(w))) return 4;
	return 4;
}

function detectDimension(text: string, keywords: readonly string[]): TasteLevel | null {
	const levels: TasteLevel[] = [];
	for (const kw of keywords) {
		let start = 0;
		while (true) {
			const idx = text.indexOf(kw, start);
			if (idx === -1) break;
			const window = text.slice(Math.max(0, idx - WINDOW), idx + kw.length + WINDOW);
			levels.push(inferLevel(window));
			start = idx + kw.length;
		}
	}
	if (levels.length === 0) return null;
	const avg = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
	if (avg <= 1) return 1;
	if (avg >= 5) return 5;
	return avg as TasteLevel;
}

function detectRoast(text: string): TasteLevel | null {
	for (const [keywords, level] of ROAST_KEYWORDS) {
		for (const kw of keywords) {
			if (text.includes(kw)) return level;
		}
	}
	for (const kw of ['로스팅', '배전', '로스트']) {
		const idx = text.indexOf(kw);
		if (idx !== -1) {
			const window = text.slice(Math.max(0, idx - WINDOW), idx + kw.length + WINDOW);
			return inferLevel(window);
		}
	}
	return null;
}

const DIM_KO: Record<(typeof TASTE_DIMENSIONS)[number], string> = {
	acidity: '산미',
	body: '바디감',
	sweetness: '단맛',
	bitterness: '쓴맛',
	roast_level: '로스팅'
};

export function ruleBasedParse(text: string): { profile: TasteProfile; rationale: string } {
	const detected: Partial<TasteProfile> = {};
	for (const dim of Object.keys(DIM_KEYWORDS) as Array<keyof typeof DIM_KEYWORDS>) {
		const level = detectDimension(text, DIM_KEYWORDS[dim]);
		if (level !== null) detected[dim] = level;
	}
	const roast = detectRoast(text);
	if (roast !== null) detected.roast_level = roast;

	const profile: TasteProfile = {
		acidity: detected.acidity ?? 3,
		body: detected.body ?? 3,
		sweetness: detected.sweetness ?? 3,
		bitterness: detected.bitterness ?? 3,
		roast_level: detected.roast_level ?? 3
	};

	const entries = Object.entries(detected) as Array<[keyof TasteProfile, TasteLevel]>;
	const found =
		entries.length > 0
			? entries.map(([d, v]) => `${DIM_KO[d]} ${LEVEL_LABEL[v]}(${v})`).join(', ')
			: '뚜렷한 취향 키워드를 찾지 못함';
	const rationale = `키워드 기반 추정 — ${found}. 언급되지 않은 항목은 중립(3)으로 설정. (규칙 기반 폴백)`;
	return { profile, rationale };
}
