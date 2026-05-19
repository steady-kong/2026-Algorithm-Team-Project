/**
 * 사용자당 레이트 리미터 (Cloudflare 바인딩 + dev 폴백).
 *
 * 운영(Cloudflare Workers): `wrangler.jsonc` 의 `ratelimits` 바인딩을 우선 사용.
 *   - 바인딩이 존재하면 `binding.limit({ key })` 호출 → CF가 카운터 관리.
 * 개발(`vite dev`): 바인딩이 없으므로 모듈 스코프 `Map` 으로 슬라이딩 윈도 직접 구현.
 *
 * 키 우선순위: UUID v7 (`X-Client-Id`) > IP+UA 해시 폴백 (limit 절반 적용).
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { isUuidV7 } from '$lib/util/uuid';

export interface BucketConfig {
	limit: number;
	windowSec: number;
	fallbackFactor?: number;
}

// 라우트별 정책 (plan.md 21.7.2 참고)
export const LIMITS: Record<'llm' | 'plain', BucketConfig> = {
	llm: { limit: 10, windowSec: 60, fallbackFactor: 0.5 },
	plain: { limit: 30, windowSec: 60, fallbackFactor: 0.5 }
};

export interface RateLimitResult {
	ok: boolean;
	retryAfter: number; // seconds
	limit: number;
	remaining: number;
}

// ────────────────────────────────────────────────────────────
// dev 폴백: 슬라이딩 윈도
// ────────────────────────────────────────────────────────────

const memory = new Map<string, number[]>();

function memoryTake(key: string, cfg: BucketConfig): RateLimitResult {
	const now = Date.now();
	const windowMs = cfg.windowSec * 1000;
	const cutoff = now - windowMs;
	const hits = (memory.get(key) ?? []).filter((ts) => ts > cutoff);
	if (hits.length >= cfg.limit) {
		const oldest = hits[0] ?? now;
		const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
		memory.set(key, hits);
		return { ok: false, retryAfter, limit: cfg.limit, remaining: 0 };
	}
	hits.push(now);
	memory.set(key, hits);
	if (memory.size > 5000) {
		for (const [k, v] of memory) {
			if (v.length === 0 || v[v.length - 1] < cutoff) memory.delete(k);
		}
	}
	return { ok: true, retryAfter: 0, limit: cfg.limit, remaining: cfg.limit - hits.length };
}

// ────────────────────────────────────────────────────────────
// Cloudflare 바인딩
// ────────────────────────────────────────────────────────────

interface CfRateLimitBinding {
	limit: (opts: { key: string }) => Promise<{ success: boolean }>;
}

function getCfBinding(
	platform: App.Platform | undefined,
	bucket: 'llm' | 'plain'
): CfRateLimitBinding | null {
	const env = platform?.env as Record<string, unknown> | undefined;
	if (!env) return null;
	const name = bucket === 'llm' ? 'RATE_LIMIT_LLM' : 'RATE_LIMIT_PLAIN';
	const b = env[name];
	if (b && typeof (b as CfRateLimitBinding).limit === 'function') {
		return b as CfRateLimitBinding;
	}
	return null;
}

// ────────────────────────────────────────────────────────────
// 키 추출
// ────────────────────────────────────────────────────────────

async function ipUaKey(event: RequestEvent): Promise<string> {
	const ip =
		event.request.headers.get('cf-connecting-ip') ??
		event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		(() => {
			try {
				return event.getClientAddress();
			} catch {
				return 'unknown';
			}
		})();
	const ua = event.request.headers.get('user-agent') ?? '';
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${ua}`));
	const hex = Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, 32);
	return `ipua:${hex}`;
}

async function resolveKey(event: RequestEvent): Promise<{ key: string; isFallback: boolean }> {
	const raw = event.request.headers.get('x-client-id');
	if (isUuidV7(raw)) return { key: `uid:${raw}`, isFallback: false };
	return { key: await ipUaKey(event), isFallback: true };
}

// ────────────────────────────────────────────────────────────
// 공개 API
// ────────────────────────────────────────────────────────────

export async function checkRateLimit(
	event: RequestEvent,
	bucket: 'llm' | 'plain'
): Promise<RateLimitResult> {
	const cfg = LIMITS[bucket];
	const { key, isFallback } = await resolveKey(event);
	const effectiveLimit = isFallback
		? Math.max(1, Math.floor(cfg.limit * (cfg.fallbackFactor ?? 0.5)))
		: cfg.limit;

	const binding = getCfBinding(event.platform, bucket);
	if (binding) {
		const result = await binding.limit({ key });
		if (!result.success) {
			return { ok: false, retryAfter: cfg.windowSec, limit: cfg.limit, remaining: 0 };
		}
		return { ok: true, retryAfter: 0, limit: cfg.limit, remaining: -1 };
	}

	return memoryTake(key, { ...cfg, limit: effectiveLimit });
}

export function rateLimitResponse(result: RateLimitResult): Response {
	const body = { error: 'rate_limited', retry_after: result.retryAfter };
	const resp = json(body, { status: 429 });
	resp.headers.set('Retry-After', String(Math.max(1, Math.ceil(result.retryAfter))));
	resp.headers.set('X-RateLimit-Limit', String(result.limit));
	if (result.remaining >= 0) resp.headers.set('X-RateLimit-Remaining', String(result.remaining));
	return resp;
}
