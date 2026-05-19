/**
 * 가벼운 입력 검증 헬퍼 (서버 전용).
 *
 * Zod 같은 별도 의존성을 끌어오지 않고 Cloudflare Worker 번들을 가볍게 유지한다.
 * 실패 시 400 으로 즉시 종료한다.
 */

import { error } from '@sveltejs/kit';
import { BREW_METHODS, type BrewMethod } from '../types/brew';
import { TASTE_DIMENSIONS, type TasteProfile, type TasteLevel } from '../types/taste';

const MAX_BODY_BYTES = 4 * 1024;

/**
 * 사용자에게 보일 수 있는 에러 메시지는 모두 한국어 + "무엇을 하면 되는지" 액션 안내.
 * 영문 코드 메시지는 디버깅 어려움 + 사용자가 어떻게 풀어야 할지 모름.
 */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().includes('application/json')) {
		throw error(415, 'JSON 형식 요청만 받아요. 페이지를 새로고침해주세요.');
	}
	const text = await request.text();
	if (text.length > MAX_BODY_BYTES) {
		throw error(413, '입력이 너무 길어요. 300자 안으로 줄여주세요.');
	}
	try {
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw error(400, '요청 형식이 올바르지 않아요. 페이지를 새로고침해주세요.');
		}
		return parsed as Record<string, unknown>;
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(400, '요청을 읽지 못했어요. 페이지를 새로고침해주세요.');
	}
}

export function requireString(
	body: Record<string, unknown>,
	field: string,
	opts: { min?: number; max?: number } = {}
): string {
	const v = body[field];
	if (typeof v !== 'string') throw error(400, '메시지를 한 줄 적어주세요.');
	const trimmed = v.trim();
	const min = opts.min ?? 1;
	const max = opts.max ?? 1000;
	if (trimmed.length < min) throw error(400, '입력이 비어 있어요. 한 줄 적어주세요.');
	if (trimmed.length > max) throw error(400, `너무 길어요. ${max}자 안으로 줄여주세요.`);
	return trimmed;
}

export function requireBrewMethod(body: Record<string, unknown>, field = 'brew_method'): BrewMethod {
	const v = body[field];
	if (typeof v !== 'string' || !(BREW_METHODS as readonly string[]).includes(v)) {
		throw error(400, '추출 기구를 다시 선택해주세요.');
	}
	return v as BrewMethod;
}

export function requireProfile(body: Record<string, unknown>, field = 'profile'): TasteProfile {
	const v = body[field];
	if (!v || typeof v !== 'object') throw error(400, '취향 정보가 없어요. 추천부터 먼저 받아주세요.');
	const o = v as Record<string, unknown>;
	const out: Record<string, TasteLevel> = {};
	for (const dim of TASTE_DIMENSIONS) {
		const n = o[dim];
		if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 5) {
			throw error(400, '취향 값이 잘못됐어요. 페이지를 새로고침하고 다시 시도해주세요.');
		}
		out[dim] = n as TasteLevel;
	}
	return out as TasteProfile;
}

export function intInRange(
	body: Record<string, unknown>,
	field: string,
	min: number,
	max: number,
	def: number
): number {
	const v = body[field];
	if (v === undefined || v === null) return def;
	if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v)) {
		throw error(400, `${field} 값을 확인해주세요.`);
	}
	if (v < min || v > max) throw error(400, `${field} 은(는) ${min}~${max} 사이여야 해요.`);
	return v;
}

export function optIntInRange(
	body: Record<string, unknown>,
	field: string,
	min: number,
	max: number
): number | null {
	const v = body[field];
	if (v === undefined || v === null) return null;
	if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v)) {
		throw error(400, `${field} 값을 확인해주세요.`);
	}
	if (v < min || v > max) throw error(400, `${field} 은(는) ${min}~${max} 사이여야 해요.`);
	return v;
}

export function numberInRange(
	body: Record<string, unknown>,
	field: string,
	min: number,
	max: number,
	def: number
): number {
	const v = body[field];
	if (v === undefined || v === null) return def;
	if (typeof v !== 'number' || !Number.isFinite(v)) {
		throw error(400, `${field} 값을 확인해주세요.`);
	}
	if (v < min || v > max) throw error(400, `${field} 은(는) ${min}~${max} 사이여야 해요.`);
	return v;
}
