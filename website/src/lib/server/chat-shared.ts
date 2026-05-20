/**
 * 채팅 라우트 공유 유틸 (`/api/chat/propose` · `/api/chat/refine`).
 *
 * propose / refine 양쪽이 같은 enum 화이트리스트 + 동일한 constraints 정규화 로직을
 * 중복 보유하던 것을 한 파일로 모았다. 양쪽 라우트가 동일한 보안 가드를 거치도록
 * 강제하기 위함이며, 한쪽만 수정해서 검증 규칙이 어긋나는 것을 방지한다.
 */

import {
	MENU_CATEGORIES,
	MILK_TYPES,
	AROMAS,
	SYRUPS,
	type MenuCategory,
	type MilkType,
	type AromaType,
	type SyrupType,
	type Temperature
} from '$lib/types/menu';
import { BREW_METHODS, type BrewMethod } from '$lib/types/brew';
import type { Constraints } from '$lib/types/constraints';

// ─── 타입 가드 (enum 화이트리스트) ───────────────────────────────────────

export const isCategory = (v: unknown): v is MenuCategory =>
	typeof v === 'string' && (MENU_CATEGORIES as readonly string[]).includes(v);

export const isBrew = (v: unknown): v is BrewMethod =>
	typeof v === 'string' && (BREW_METHODS as readonly string[]).includes(v);

export const isMilk = (v: unknown): v is MilkType =>
	typeof v === 'string' && (MILK_TYPES as readonly string[]).includes(v);

export const isAroma = (v: unknown): v is AromaType =>
	typeof v === 'string' && (AROMAS as readonly string[]).includes(v);

export const isSyrup = (v: unknown): v is SyrupType =>
	typeof v === 'string' && (SYRUPS as readonly string[]).includes(v);

export const isTemperature = (v: unknown): v is Temperature =>
	v === 'hot' || v === 'iced';

// ─── 수치 보정 ──────────────────────────────────────────────────────────

/** 1~5 정수로 clamp. 비수 또는 범위 밖이면 가장 가까운 끝값. */
export function clamp1to5(n: number): number {
	if (n < 1) return 1;
	if (n > 5) return 5;
	return Math.round(n);
}

// ─── constraints 정규화 ─────────────────────────────────────────────────

/**
 * 클라/LLM 이 보낸 raw constraints 를 안전하게 정규화한다.
 *
 * 빈 배열은 절대 set 하지 않는다 — LLM 이 무심코 `[]` 를 보낼 때
 * `category_only: []` 같은 필드가 "모든 카테고리 차단" 으로 잘못 해석되는
 * 사고를 막기 위함. 알 수 없는 enum 값은 조용히 걸러낸다.
 */
export function sanitizeConstraints(raw: unknown): Constraints {
	if (!raw || typeof raw !== 'object') return {};
	const o = raw as Record<string, unknown>;
	const out: Constraints = {};
	if (Array.isArray(o.exclude_brew_method)) {
		const v = o.exclude_brew_method.filter(isBrew) as BrewMethod[];
		if (v.length > 0) out.exclude_brew_method = v;
	}
	if (isMilk(o.milk_type)) out.milk_type = o.milk_type;
	if (typeof o.exclude_milk === 'boolean' && o.exclude_milk) out.exclude_milk = true;
	if (Array.isArray(o.exclude_aroma)) {
		const v = o.exclude_aroma.filter(isAroma) as AromaType[];
		if (v.length > 0) out.exclude_aroma = v;
	}
	if (Array.isArray(o.exclude_syrup)) {
		const v = o.exclude_syrup.filter(isSyrup) as SyrupType[];
		if (v.length > 0) out.exclude_syrup = v;
	}
	if (typeof o.iced_only === 'boolean' && o.iced_only) out.iced_only = true;
	if (typeof o.hot_only === 'boolean' && o.hot_only) out.hot_only = true;
	if (Array.isArray(o.category_only)) {
		const v = o.category_only.filter(isCategory) as MenuCategory[];
		if (v.length > 0) out.category_only = v;
	}
	if (typeof o.max_budget_krw === 'number' && o.max_budget_krw > 0) {
		out.max_budget_krw = Math.floor(o.max_budget_krw);
	}
	return out;
}
