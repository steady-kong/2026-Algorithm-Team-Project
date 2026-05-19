/**
 * 추천 메뉴와 짝지어 노출할 *이야깃거리*·*관련 메뉴* 후속 질문 칩.
 *
 * 동기 — 추천 카드에 원두 산지·로스트만 적혀 있으면 사용자는 "그래서 뭐?" 로 끝나기 쉽다.
 * `coffee-knowledge.ts` 에 검증된 도메인 사실이 이미 있으니, 추천 카드의 산지·카테고리·
 * inspired_by 항목과 연결되는 *후속 질문* 을 빠른 응답 칩으로 노출해 사용자가 자연스럽게
 * 이야기/관련 메뉴를 꺼내볼 수 있게 한다. 클릭하면 기존 ask 흐름이 받아 ANSWERS 에서
 * 결정적 답변을 돌려준다 ([§42](../../../../plan.md#42-커피-도메인-qa--infomd-기반-지식-응답-2026-05-20-구현-완료)).
 *
 * 매칭 우선순위 (`pickRelatedQuestions`):
 *   1) 시그니처 라이브러리 id (가장 구체적) — 달고나·아인슈페너처럼 단일 메뉴에 강한 이야깃거리.
 *   2) bean_hint.origin 정규식 — 산지 기반.
 *   3) 메뉴 카테고리 — 가장 일반적 폴백.
 *
 * 모든 질문은 `ANSWERS` (coffee-knowledge.ts) 가 답할 수 있는 키워드로 작성한다 — 칩을
 * 누르면 즉시 결정적 답변이 나오는 게 보장돼야 한다.
 */

import type { MenuCategory } from '../types/menu';
import type { Locale } from '../util/locale';
import type { BeanHint } from '../types/recipe';

interface QuestionPair {
	ko: string;
	en: string;
}

interface OriginHook {
	pattern: RegExp;
	questions: readonly QuestionPair[];
}

/** 산지 키워드 → 후속 질문. bean_hint.origin 문자열에 매칭. */
const ORIGIN_HOOKS: readonly OriginHook[] = [
	{
		pattern: /에티오피아|예가체프|시다모|ethiopia|yirgacheffe|sidamo/i,
		questions: [
			{ ko: '에티오피아 원두 어때?', en: 'How about Ethiopian beans?' },
			{ ko: '워시드 vs 내추럴 차이?', en: 'Washed vs natural process?' }
		]
	},
	{
		pattern: /콜롬비아|우일라|colombia|huila/i,
		questions: [
			{ ko: '콜롬비아 원두 어때?', en: 'How about Colombian beans?' },
			{ ko: '미디엄 로스트 특징?', en: 'What is a medium roast?' }
		]
	},
	{
		pattern: /브라질|세하도|brazil|cerrado/i,
		questions: [
			{ ko: '브라질 원두 어때?', en: 'How about Brazilian beans?' },
			{ ko: '다크 로스트 특징?', en: 'What is a dark roast?' }
		]
	},
	{
		pattern: /케냐|kenya/i,
		questions: [
			{ ko: '케냐 원두 어때?', en: 'How about Kenyan beans?' },
			{ ko: '산미 5축이 뭐야?', en: 'What does acidity mean on the 5-axis?' }
		]
	},
	{
		pattern: /과테말라|안티구아|guatemala|antigua/i,
		questions: [
			{ ko: '과테말라 안티구아 알려줘', en: 'Tell me about Guatemala Antigua' },
			{ ko: '미디엄 로스트 특징?', en: 'What is a medium roast?' }
		]
	},
	{
		pattern: /인도네시아|만델링|수마트라|indonesia|mandheling|sumatra/i,
		questions: [
			{ ko: '만델링 원두 어때?', en: 'How about Mandheling beans?' },
			{ ko: '다크 로스트 특징?', en: 'What is a dark roast?' }
		]
	},
	{
		pattern: /예멘|모카\s*(?:항|커피)?|yemen|mocha port/i,
		questions: [
			{ ko: '예멘 모카는 어떤 원두야?', en: 'Tell me about Yemen Mocha' },
			{ ko: '커피의 기원이 뭐야?', en: 'What is the origin of coffee?' }
		]
	},
	{
		pattern: /게이샤|파나마|geisha|panama/i,
		questions: [
			{ ko: '파나마 게이샤 알려줘', en: 'Tell me about Panama Geisha' },
			{ ko: '워시드 vs 내추럴 차이?', en: 'Washed vs natural process?' }
		]
	},
	// 인스턴트 — 달고나용 폴백. 별도 후속 질문은 LIBRARY_HOOKS 가 더 강하게 잡음.
	{
		pattern: /인스턴트|instant/i,
		questions: [{ ko: '달고나 누가 만들었어?', en: 'Who invented dalgona coffee?' }]
	}
];

/** 메뉴 카테고리 → 후속 질문. 산지 매칭 실패 시 폴백. */
const CATEGORY_HOOKS: Record<MenuCategory, readonly QuestionPair[]> = {
	black: [
		{ ko: '핸드드립 어떻게 만들어?', en: 'How is pour-over made?' },
		{ ko: '라이트 로스트 특징?', en: 'What is a light roast?' }
	],
	latte: [
		{ ko: '아인슈페너 어때?', en: 'What about einspänner?' },
		{ ko: '라떼 vs 플랫화이트?', en: 'Latte vs flat white?' }
	],
	cappuccino: [
		{ ko: '카푸치노 어원이 뭐야?', en: 'Where does the name cappuccino come from?' },
		{ ko: '카푸치노 vs 꼬르타도?', en: 'Cappuccino vs cortado?' }
	],
	flat_white: [
		{ ko: '플랫화이트 어디서 시작됐어?', en: 'Where did flat white start?' },
		{ ko: '라떼랑 뭐가 달라?', en: "How is it different from a latte?" }
	],
	mocha: [
		{ ko: '카페모카 유래가 뭐야?', en: 'Where does caffè mocha come from?' },
		{ ko: '예멘 모카는 어떤 원두야?', en: 'Tell me about Yemen Mocha' }
	],
	macchiato: [
		{ ko: '마키아토 전통 vs 모던?', en: 'Traditional vs modern macchiato?' }
	],
	cortado: [
		{ ko: '꼬르타도 어디 발원이야?', en: 'Where is cortado from?' },
		{ ko: '카푸치노 vs 꼬르타도?', en: 'Cappuccino vs cortado?' }
	],
	affogato: [
		{ ko: '아포가토 이름 뜻은?', en: 'What does affogato mean?' },
		{ ko: '아인슈페너 어때?', en: 'What about einspänner?' }
	],
	cold_brew: [
		{ ko: '콜드브루 어떻게 만들어?', en: 'How is cold brew made?' },
		{ ko: '교토식이랑 뭐가 달라?', en: 'Difference from Kyoto-style?' }
	],
	iced_americano: [
		{ ko: '아메리카노 왜 한국에서 인기야?', en: 'Why is the iced americano so popular in Korea?' },
		{ ko: '한국 커피사 알려줘', en: 'Tell me about Korean coffee history' }
	],
	dalgona: [
		{ ko: '달고나 누가 만들었어?', en: 'Who invented dalgona coffee?' },
		{ ko: '한국 커피사 알려줘', en: 'Tell me about Korean coffee history' }
	]
};

/**
 * 시그니처 라이브러리 id → 후속 질문. 단일 메뉴에 강한 이야깃거리(달고나·아인슈페너 등)
 * 가 있을 때 카테고리/산지 폴백보다 우선 노출.
 */
const LIBRARY_HOOKS: Record<string, readonly QuestionPair[]> = {
	'r-dalgona': [
		{ ko: '달고나 누가 만들었어?', en: 'Who invented dalgona coffee?' },
		{ ko: '한국 커피사 알려줘', en: 'Tell me about Korean coffee history' }
	],
	'r-einspanner': [
		{ ko: '아인슈페너 유래가 뭐야?', en: 'What is the origin of einspänner?' },
		{ ko: '비엔나 커피하우스 알려줘', en: 'Tell me about Viennese coffee houses' }
	],
	'r-flatwhite': [
		{ ko: '플랫화이트 어디서 시작됐어?', en: 'Where did flat white start?' }
	],
	'r-affogato': [
		{ ko: '아포가토 이름 뜻은?', en: 'What does affogato mean?' }
	],
	'r-mocha': [
		{ ko: '카페모카 유래가 뭐야?', en: 'Where does caffè mocha come from?' }
	],
	'r-iced-americano': [
		{ ko: '아메리카노 왜 한국에서 인기야?', en: 'Why is the iced americano so popular in Korea?' }
	],
	'r-cold-brew': [
		{ ko: '콜드브루 어떻게 만들어?', en: 'How is cold brew made?' },
		{ ko: '교토식이랑 뭐가 달라?', en: 'Difference from Kyoto-style?' }
	],
	'r-handdrip': [
		{ ko: '핸드드립 어떻게 만들어?', en: 'How is pour-over made?' }
	],
	'r-aeropress': [
		{ ko: '에어로프레스 어떻게 만들어?', en: 'How is AeroPress made?' }
	]
};

/** pickRelatedQuestions 가 받는 최소 형태 — Recipe 든 Proposal-like 든 통합. */
export interface ProposalShape {
	recipe?: { menu_category?: MenuCategory; bean_hint?: BeanHint };
	menu_category?: MenuCategory;
	bean_hint?: BeanHint;
	inspired_by?: readonly { id: string }[];
}

/**
 * 추천 카드들로부터 후속 질문 칩 후보를 뽑는다.
 * 우선순위: 시그니처 라이브러리 id → 산지 → 카테고리.
 *
 * @param proposals - Recipe 또는 Proposal-like 객체 배열 (menu_category·bean_hint·inspired_by 사용)
 * @param locale    - 출력 언어
 * @param limit     - 최대 칩 수 (기본 2)
 */
export function pickRelatedQuestions(
	proposals: readonly ProposalShape[],
	locale: Locale,
	limit = 2
): string[] {
	if (limit <= 0 || proposals.length === 0) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	const push = (q: QuestionPair) => {
		const v = locale === 'en' ? q.en : q.ko;
		if (seen.has(v)) return;
		seen.add(v);
		out.push(v);
	};

	const getCategory = (p: ProposalShape): MenuCategory | undefined =>
		p.recipe?.menu_category ?? p.menu_category;
	const getOrigin = (p: ProposalShape): string =>
		p.recipe?.bean_hint?.origin ?? p.bean_hint?.origin ?? '';

	// 1) 시그니처 라이브러리 id — 가장 구체적이라 먼저.
	for (const p of proposals) {
		if (out.length >= limit) break;
		for (const ib of p.inspired_by ?? []) {
			const hits = LIBRARY_HOOKS[ib.id];
			if (hits) {
				for (const q of hits) {
					if (out.length >= limit) break;
					push(q);
				}
			}
			if (out.length >= limit) break;
		}
	}

	// 2) 산지 매칭.
	for (const p of proposals) {
		if (out.length >= limit) break;
		const origin = getOrigin(p);
		if (!origin) continue;
		for (const h of ORIGIN_HOOKS) {
			if (h.pattern.test(origin)) {
				for (const q of h.questions) {
					if (out.length >= limit) break;
					push(q);
				}
				break;
			}
		}
	}

	// 3) 카테고리 폴백.
	for (const p of proposals) {
		if (out.length >= limit) break;
		const cat = getCategory(p);
		if (!cat) continue;
		const hits = CATEGORY_HOOKS[cat];
		if (!hits) continue;
		for (const q of hits) {
			if (out.length >= limit) break;
			push(q);
		}
	}

	return out;
}
