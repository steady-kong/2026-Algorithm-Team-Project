/**
 * 함수 호출(tool use) 도구 레지스트리 — plan.md §50.
 *
 * LLM 은 도구를 "어떤 인자로 부를지" 만 정한다. 실제 계산은 결정적 알고리즘이 한다.
 *
 *  - 생성/제출형(종결): present_recommendations / present_answer
 *      → LLM 이 자체 지식으로 만든 후보 풀(데이터)을 제출. 점수화·정렬·다양성·블렌딩 같은
 *        선택 로직은 서버(propose 라우트)가 from-scratch 알고리즘으로 수행한다.
 *  - 계산형(비종결): blend_candidates
 *      → 두 5축 취향을 비율로 선형 보간(blend.ts). "두 개 섞은 느낌" 을 결정적으로 계산.
 *
 * 종결 도구의 handler 는 실제로 실행되지 않는다 — chatWithTools 가 호출 즉시 인자를 회수하고
 * 루프를 끝낸다. 그래도 ToolDef 형태를 맞추기 위해 인자를 그대로 돌려주는 no-op 을 둔다.
 */

import { blendProfiles } from '$lib/algorithms/blend';
import { sanitizeProfile } from '$lib/types/taste';
import { MENU_CATEGORIES, MILK_TYPES, AROMAS, SYRUPS } from '$lib/types/menu';
import { BREW_METHODS } from '$lib/types/brew';
import { ROAST_LEVELS } from '$lib/types/recipe';
import { findAnswer } from '$lib/data/coffee-knowledge';
import type { Locale } from '$lib/util/locale';
import type { ToolDef } from '$lib/server/upstage';

/**
 * 비종결 조회 도구 — LLM 이 지식 질문에 답하기 전에 검증된 자료(coffee-knowledge)를 조회해
 * 근거를 확보하게 한다. plan.md §50/§56 의 "AI 주도 도구 오케스트레이션" 1차 단계.
 * 사실(연도·수치·가공)을 LLM 환각이 아니라 조회 결과 위에서 존댓말로 재서술하도록 유도.
 */
function lookupKnowledgeTool(locale: Locale): ToolDef {
	return {
		schema: {
			type: 'function',
			function: {
				name: 'lookup_knowledge',
				description:
					'커피 지식(산지·가공·로스팅·추출·메뉴·역사·5축) 사실을 검증된 자료에서 조회한다. ' +
					'지식 질문에 답하기 전에 호출해 근거를 확보하라. topic 에 핵심어를 넣는다(예: "콜드브루", "만델링 가공", "라이트 로스트"). ' +
					'결과 found=false 면 검증된 사실이 없는 것이니 구체적 수치·연도·이름은 만들지 마라.',
				parameters: {
					type: 'object',
					properties: {
						topic: { type: 'string', description: '조회할 핵심어/주제(한 개념)' }
					},
					required: ['topic']
				}
			}
		},
		handler: (args) => {
			const topic = typeof args.topic === 'string' ? args.topic : '';
			const fact = findAnswer(topic, locale);
			if (fact) return { found: true, fact };
			return {
				found: false,
				note:
					locale === 'en'
						? 'No verified entry. Do not invent specific years, numbers, or names.'
						: '검증된 항목이 없어요. 구체적 연도·수치·이름은 지어내지 마세요.'
			};
		}
	};
}

const TASTE_AXIS_SCHEMA = {
	type: 'object',
	description: '예상 5축 취향 (각 1~5 정수)',
	properties: {
		acidity: { type: 'integer', minimum: 1, maximum: 5 },
		body: { type: 'integer', minimum: 1, maximum: 5 },
		sweetness: { type: 'integer', minimum: 1, maximum: 5 },
		bitterness: { type: 'integer', minimum: 1, maximum: 5 },
		roast_level: { type: 'integer', minimum: 1, maximum: 5 }
	},
	required: ['acidity', 'body', 'sweetness', 'bitterness', 'roast_level']
};

const CANDIDATE_SCHEMA = {
	type: 'object',
	description: '후보 메뉴 한 개. 모든 enum 은 아래 허용값 안에서만.',
	properties: {
		name: { type: 'string', description: '메뉴 이름(20자 이내, 사용자 입력과 같은 언어)' },
		tagline: { type: 'string', description: '한 줄 매력 문구(40자 이내, 사용자 입력과 같은 언어)' },
		category: { type: 'string', enum: [...MENU_CATEGORIES] },
		brew_method: { type: 'string', enum: [...BREW_METHODS] },
		milk_type: { type: 'string', enum: [...MILK_TYPES] },
		aroma: { type: 'string', enum: [...AROMAS] },
		syrups: { type: 'array', items: { type: 'string', enum: [...SYRUPS] }, description: '0~2개' },
		temperature: { type: 'string', enum: ['hot', 'iced'] },
		predicted: TASTE_AXIS_SCHEMA,
		bean_hint: {
			type: 'object',
			description:
				'이 메뉴에 어울리는 추천 원두. 산지·로스트·풍미를 네 지식으로 떠올려 채워라(고정 목록 없음). ' +
				'로스트 가이드: 우유 음료(라떼·카푸치노·플랫화이트·모카)는 보통 medium~dark, 필터/블랙은 light~medium. ' +
				'산지·풍미는 응답 언어와 같은 언어로 적어라(영어 응답엔 영어 산지명). ' +
				'**가공방식(워시드/내추럴)은 확실할 때만 적고, 아니면 산지명만 적어라**(틀린 가공 표기 금지 — 예: 만델링은 워시드 아님). ' +
				'달고나처럼 인스턴트가 정체성인 메뉴는 비워도 된다.',
			properties: {
				origin: { type: 'string', description: '산지·가공 한 줄 (예: "에티오피아 예가체프 워시드")' },
				roast: { type: 'string', enum: [...ROAST_LEVELS] },
				notes: { type: 'array', items: { type: 'string' }, description: '대표 풍미 노트 1~3개' },
				rationale: { type: 'string', description: '왜 이 메뉴에 이 원두가 어울리는지 한 줄' }
			},
			required: ['origin', 'roast', 'notes']
		}
	},
	required: ['name', 'tagline', 'category', 'brew_method', 'milk_type', 'aroma', 'temperature', 'predicted']
};

/**
 * propose 라우트용 도구 묶음.
 * 종결 도구의 인자는 chatWithTools 가 회수해 라우트가 검증/랭킹한다.
 */
export function buildProposeTools(locale: Locale = 'ko'): Record<string, ToolDef> {
	return {
		lookup_knowledge: lookupKnowledgeTool(locale),

		blend_candidates: {
			schema: {
				type: 'function',
				function: {
					name: 'blend_candidates',
					description:
						'두 5축 취향을 weight_a:(1-weight_a) 비율로 선형 보간해 "둘을 섞은" 취향을 ' +
						'결정적으로 계산한다. 하이브리드 메뉴의 예상 취향을 만들 때 사용.',
					parameters: {
						type: 'object',
						properties: {
							a: TASTE_AXIS_SCHEMA,
							b: TASTE_AXIS_SCHEMA,
							weight_a: {
								type: 'number',
								minimum: 0,
								maximum: 1,
								description: 'a 의 비중(0~1). 기본 0.5'
							}
						},
						required: ['a', 'b']
					}
				}
			},
			handler: (args) => {
				const a = sanitizeProfile(args.a);
				const b = sanitizeProfile(args.b);
				const w = typeof args.weight_a === 'number' ? args.weight_a : 0.5;
				return { blended: blendProfiles(a, b, w) };
			}
		},

		present_recommendations: {
			terminal: true,
			schema: {
				type: 'function',
				function: {
					name: 'present_recommendations',
					description:
						'추천을 제출한다. candidates 에 서로 다른 스타일의 후보 **5~6개**를 자체 지식으로 ' +
						'생성해 담아라(정적 목록 없음 — 실시간으로 떠올려라). 최종 3장 선택·정렬·다양화는 ' +
						'서버 알고리즘이 한다. 추천 의도일 때 반드시 이 도구로 끝내라. ' +
						'profile_hint(사용자 취향을 5축으로 추정)도 반드시 채운다.',
					parameters: {
						type: 'object',
						properties: {
							assistant: {
								type: 'string',
								description: '짧고 친근한 한 줄(사용자 입력과 같은 언어). 후보 개수·내부 처리 언급 금지, 최종 3잔 기준.'
							},
							profile_hint: TASTE_AXIS_SCHEMA,
							candidates: {
								type: 'array',
								description: '후보 메뉴 5~6개',
								items: CANDIDATE_SCHEMA
							}
						},
						required: ['assistant', 'profile_hint', 'candidates']
					}
				}
			},
			handler: (args) => args
		},

		present_answer: {
			terminal: true,
			schema: {
				type: 'function',
				function: {
					name: 'present_answer',
					description:
						'커피 지식·역사·산지·로스팅 등 정보 질문에 답할 때 사용. 추천 카드 없이 ' +
						'assistant 텍스트만 제출. 모르는 구체적 사실(연도·이름·수치)은 만들지 마라.',
					parameters: {
						type: 'object',
						properties: {
							assistant: { type: 'string', description: '2~3문장(300자 이내, 사용자 입력과 같은 언어)' }
						},
						required: ['assistant']
					}
				}
			},
			handler: (args) => args
		}
	};
}

const CONSTRAINTS_SCHEMA = {
	type: 'object',
	description: '갱신할 제약 (변경할 필드만)',
	properties: {
		exclude_brew_method: { type: 'array', items: { type: 'string', enum: [...BREW_METHODS] } },
		brew_method: {
			type: 'string',
			enum: [...BREW_METHODS],
			description:
				'기구를 이걸로 바꾸라는 요청(드립/푸어오버=hand_drip, 프렌치프레스=french_press 등). 배제(exclude)가 아니라 양성 전환. 이 값이 있으면 intent=explore.'
		},
		milk_type: { type: 'string', enum: [...MILK_TYPES] },
		exclude_milk: { type: 'boolean' },
		exclude_aroma: { type: 'array', items: { type: 'string', enum: [...AROMAS] } },
		exclude_syrup: { type: 'array', items: { type: 'string', enum: [...SYRUPS] } },
		iced_only: { type: 'boolean' },
		hot_only: { type: 'boolean' },
		category_only: { type: 'array', items: { type: 'string', enum: [...MENU_CATEGORIES] } }
	}
};

const DELTA_SCHEMA = {
	type: 'object',
	description: '5축 보정 (-2~+2 정수, 변경할 축만)',
	properties: {
		acidity: { type: 'integer', minimum: -2, maximum: 2 },
		body: { type: 'integer', minimum: -2, maximum: 2 },
		sweetness: { type: 'integer', minimum: -2, maximum: 2 },
		bitterness: { type: 'integer', minimum: -2, maximum: 2 },
		roast_level: { type: 'integer', minimum: -2, maximum: 2 }
	}
};

/**
 * refine 라우트용 도구 — 자연어 후속 요청을 "패치" 로 제출한다(present_patch, 종결).
 * 실제 적용(mod/alt/general 생성)은 서버의 결정적 로직이 한다. plan.md §50 refine 전환.
 */
export function buildRefineTools(locale: Locale = 'ko'): Record<string, ToolDef> {
	return {
		lookup_knowledge: lookupKnowledgeTool(locale),

		present_patch: {
			terminal: true,
			schema: {
				type: 'function',
				function: {
					name: 'present_patch',
					description:
						'사용자의 후속 요청을 현재 추천에 대한 패치로 제출한다. 자유 텍스트 대신 이 도구를 호출하라. ' +
						'intent 가이드: 선택 메뉴 위 변형(더 달게/오트로/더 진하게)→adjust, 메뉴 자체 교체→explore, ' +
						'카테고리 강제 좁힘(라떼만)→swap+category_only, 커피 지식 질문→ask. ' +
						'**추출 기구 전환 요청(드립/푸어오버/필터/프렌치프레스 등)은 ask 가 아니라 explore + constraints.brew_method 로 지정.** ' +
						'"~로 추천해줘/내려줘" 처럼 추천을 요구하면 지식 답변(ask)이 아니라 추천(explore)이다. ' +
						'사용자가 직전 추천이 자기 요청과 다르다고 지적하면(예: "왜 ~했어", "내가 ~해달라고 했잖아") 변명하지 말고 ' +
						'그 요청대로 explore 로 다시 추천하라(필요하면 brew_method 도 함께 지정). ' +
						'**intent=ask 로 답할 땐 먼저 `lookup_knowledge` 로 사실을 조회하고, 그 결과에 근거해 존댓말로 assistant_text 를 써라.** ' +
						'조회 결과 밖의 구체적 사실(연도·수치·이름)은 만들지 마라.',
					parameters: {
						type: 'object',
						properties: {
							intent: { type: 'string', enum: ['swap', 'remove', 'adjust', 'explore', 'ask'] },
							constraints: CONSTRAINTS_SCHEMA,
							profile_delta: DELTA_SCHEMA,
							category_hint: { type: 'string', enum: [...MENU_CATEGORIES] },
							assistant_text: { type: 'string', description: '한 줄 응답(사용자 입력과 같은 언어). ask 면 2~3문장.' }
						},
						required: ['intent', 'assistant_text']
					}
				}
			},
			handler: (args) => args
		}
	};
}
