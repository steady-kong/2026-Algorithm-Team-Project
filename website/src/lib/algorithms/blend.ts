/**
 * 블렌딩(단위 보간) from-scratch.
 *
 * "두 개를 섞은 느낌" 을 결정적으로 계산한다 — LLM 이 두 후보(원두/취향)를 비율로
 * 합치고 싶을 때, 점수는 알고리즘이 선형 보간으로 만든다.
 *
 *  - blendProfiles: 5축 취향을 weightA:(1-weightA) 비율로 각 축 선형 보간 후 1~5 clamp.
 *  - blendNotes: 풍미 노트를 비중 큰 쪽 우선으로 합치고 중복 제거(최대 max개).
 *
 * 표준 라이브러리 정렬/맵 의존 없이 직접 구현 (plan.md §50 "데이터는 LLM, 계산은 알고리즘").
 */

import { TASTE_DIMENSIONS, clampLevel, type TasteProfile } from '../types/taste';

/** 0~1 범위로 가중치를 정규화. 비정상 입력은 0.5(균등)로. */
function normalizeWeight(w: unknown): number {
	const v = typeof w === 'number' ? w : Number(w);
	if (!Number.isFinite(v)) return 0.5;
	if (v < 0) return 0;
	if (v > 1) return 1;
	return v;
}

/**
 * 두 5축 취향을 weightA:(1-weightA) 비율로 선형 보간한다.
 * 각 축 `round(a*w + b*(1-w))` 후 1~5 clamp (clampLevel 재사용).
 */
export function blendProfiles(
	a: TasteProfile,
	b: TasteProfile,
	weightA: number = 0.5
): TasteProfile {
	const w = normalizeWeight(weightA);
	const out = {} as TasteProfile;
	for (const dim of TASTE_DIMENSIONS) {
		out[dim] = clampLevel(a[dim] * w + b[dim] * (1 - w));
	}
	return out;
}

/**
 * 풍미 노트 두 묶음을 합친다. 비중 큰 쪽(weightA ≥ 0.5 면 a) 노트를 먼저 놓고,
 * 대소문자/공백을 정규화해 중복을 제거한 뒤 최대 `max` 개로 자른다.
 */
export function blendNotes(
	a: readonly string[],
	b: readonly string[],
	weightA: number = 0.5,
	max: number = 4
): string[] {
	const w = normalizeWeight(weightA);
	const primary = w >= 0.5 ? a : b;
	const secondary = w >= 0.5 ? b : a;
	const out: string[] = [];
	const seen = new Set<string>();
	for (const note of [...primary, ...secondary]) {
		const trimmed = note.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(trimmed);
		if (out.length >= max) break;
	}
	return out;
}
