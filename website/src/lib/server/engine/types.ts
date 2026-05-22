/**
 * 추천 엔진 공유 타입 — 다른 백엔드 유닛(점수화·정렬·선택·캐시·영속화)이 import 한다.
 *
 * 이 파일은 **타입 정의만** 둔다. 점수 계산·캐싱·DB 질의 로직은 각 유닛에서 구현한다.
 * 안정적인 인터페이스를 목표로 하므로 필드 추가는 신중히(가급적 optional).
 *
 * 5축 취향(acidity/body/sweetness/bitterness/roast_level, 각 1~5 정수)은
 * `$lib/types/taste` 의 TasteProfile/TasteDimension 을 그대로 사용한다.
 */

import type { TasteProfile, TasteDimension } from '$lib/types/taste';
import type { MenuCategory, MilkType, AromaType, SyrupType, Temperature } from '$lib/types/menu';
import type { BrewMethod } from '$lib/types/brew';
import type { BeanHint } from '$lib/types/recipe';

/**
 * 메뉴 후보 한 개의 "사양". LLM(present_recommendations 도구)이 자체 지식으로 생성하거나
 * 규칙 폴백이 라이브러리 항목에서 만든다. 모든 enum 은 화이트리스트 검증을 거친 값이다.
 *
 * propose 라우트가 로컬에 두고 쓰던 모양을 엔진 공용으로 끌어올린 것 — 정렬·선택·영속화
 * 유닛이 동일한 spec 을 공유한다.
 */
export interface ProposalSpec {
	name: string;
	tagline: string;
	category: MenuCategory;
	brew_method: BrewMethod;
	milk_type: MilkType;
	aroma: AromaType;
	syrups: SyrupType[];
	temperature: Temperature;
	/** 라이브러리에서 영감 받은 항목 id 들 (1~2개). 검증 후 클라에는 {id, name} 으로 응답. */
	inspired_by_ids?: string[];
	/** LLM 이 직접 생성한 추천 원두 힌트. 없으면 라이브러리/카테고리 디폴트로 폴백. */
	bean_hint?: BeanHint;
}

/**
 * 점수화를 마친 후보. 정렬·다양화 유닛은 `fit` 내림차순으로 안정 정렬한다.
 *
 *  - `axisScore`  : 목표 5축과 예상 5축의 유사도 점수.
 *  - `contextScore`: 우유/기구/온도/단맛·쓴맛 등 컨텍스트 신호 가·감점.
 *  - `fit`        : 위 둘을 합산한 최종 적합도(정렬 키).
 */
export interface ScoredCandidate {
	spec: ProposalSpec;
	/** 이 후보의 예상 5축 컵 프로파일. */
	predicted: TasteProfile;
	axisScore: number;
	contextScore: number;
	fit: number;
}

/**
 * 사용자 발화·제약에서 추출한 컨텍스트 신호. 점수화 유닛이 contextScore 계산에 쓴다.
 * 전부 optional — 단서가 없으면 비워둔다(중립).
 */
export interface ContextSignals {
	wantsMilk?: boolean;
	/** 사용자가 콕 집은 추출 기구(드립/프렌치프레스 등). 없으면 미지정. */
	wantedBrew?: BrewMethod | null;
	wantsIced?: boolean;
	wantsSweet?: boolean;
	wantsBitter?: boolean;
	/** 사용자가 콕 집은 메뉴 카테고리(라떼·콜드브루 등). 없으면 미지정. */
	explicitCategory?: MenuCategory | null;
}

/** 5축 각각의 가중치. axisScore 계산에서 축별 중요도 조절에 쓴다. */
export type AxisWeights = Record<TasteDimension, number>;

/**
 * LLM 함수 호출 루프가 돌려준 후보 풀(데이터). 정렬·선택은 서버 알고리즘이 한다.
 */
export interface CandidatePool {
	candidates: ScoredCandidate[];
	/** LLM 이 추정한 사용자 5축 취향 힌트. 없으면 null. */
	profile_hint: TasteProfile | null;
	/** 사용자에게 보여줄 짧은 한 줄 멘트. */
	assistant: string;
}

/**
 * 엔진이 의존하는 Cloudflare 자원. 바인딩이 없으면(로컬 dev/미생성) 전부 null 일 수 있으니
 * 사용처에서 반드시 null 체크 후 graceful degrade 한다. bindings.ts 의 접근자가 이 모양을 채운다.
 */
export interface EngineDeps {
	cache: KVNamespace | null;
	db: D1Database | null;
	ctx: ExecutionContext | null;
}

// ────────────────────────────────────────────────────────────
// 영속화 레코드 (D1) — client_id(익명) 기준. 인증/세션 개념 없음.
// JSON 컬럼은 직렬화된 문자열로 저장되며, 여기 타입은 파싱 후 형태를 기술한다.
// ────────────────────────────────────────────────────────────

/** recommendation_history 한 행. 한 번의 추천 응답(카드 묶음)을 기록. */
export interface RecommendationRecord {
	id: string;
	client_id: string;
	/** epoch milliseconds. */
	ts: number;
	/** 사용자 질의 원문(요약). */
	query: string | null;
	/** 추천 당시 목표 5축 취향. */
	target: TasteProfile | null;
	/** 응답한 카드들의 spec. */
	cards: ProposalSpec[];
}

/** feedback 한 행. 특정 추천 카드에 대한 사용자 평가(좋아요/싫어요)와 5축 보정. */
export interface FeedbackRecord {
	id: string;
	client_id: string;
	/** 어떤 추천에 대한 피드백인지 (recommendation_history.id). 없으면 null. */
	recommendation_id: string | null;
	/** 카드 식별 시그니처(카테고리·우유·향 등 조합 해시/문자열). */
	card_signature: string | null;
	/** 이 피드백이 가리키는 5축 값(예: 평가된 카드의 예상 취향). */
	axes: TasteProfile | null;
	/** +1(좋아요) / -1(싫어요) / 0(중립). */
	vote: number;
	/** epoch milliseconds. */
	ts: number;
}

/** taste_profiles 한 행. client_id 별 누적 취향 + 축별 통계. */
export interface StoredTasteProfile {
	client_id: string;
	/** 누적·평활한 5축 취향. */
	profile: TasteProfile | null;
	/** 축별 통계(표본 수·평균·분산 등). 점수화 유닛이 형태를 확정한다. */
	axis_stats: Partial<Record<TasteDimension, { count: number; mean: number; m2?: number }>> | null;
	/** epoch milliseconds. */
	updated: number;
}
