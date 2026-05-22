import { cubicOut, cubicInOut } from 'svelte/easing';

/**
 * 모션 레이어 — Svelte 내장 transition(fade/fly/scale 등)과 함께 쓰는
 * 작은 프리셋 모음. layout.css의 모션 토큰과 결을 맞춘다.
 */

/** 지속시간 프리셋 (ms). CSS의 --motion-* 토큰과 동일한 값. */
export const duration = {
	fast: 150,
	base: 250,
	slow: 400
} as const;

/** 이징 프리셋 — svelte/easing 곡선. */
export const easing = {
	standard: cubicOut,
	inOut: cubicInOut
} as const;

/** fade transition 파라미터 프리셋. */
export const fadeIn = { duration: duration.base, easing: easing.standard };

/** fly(slide-up) transition 파라미터 프리셋. */
export const slideUp = { y: 12, duration: duration.base, easing: easing.standard };

/** scale transition 파라미터 프리셋. */
export const scaleIn = { start: 0.96, duration: duration.base, easing: easing.standard };

/**
 * 사용자가 모션 감소를 선호하는지 여부.
 * SSR/`window` 부재 환경에서는 안전하게 false를 반환한다.
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return false;
	}
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
