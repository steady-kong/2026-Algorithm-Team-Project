/**
 * Cloudflare 바인딩 방어적 접근자 — KV(COFFEE_CACHE) / D1(COFFEE_DB) / ExecutionContext.
 *
 * 바인딩은 운영(Cloudflare Workers)에서만 존재한다. 로컬 dev(`vite dev`)나 아직 생성하지
 * 않은 환경에서는 없을 수 있으므로, `platform?.env` 를 방어적으로 읽고 **메서드 모양까지**
 * 확인한 뒤에만 반환한다(없으면 null → 호출처가 graceful degrade). ratelimit.ts 의
 * getCfBinding 패턴을 그대로 따른다.
 */

/** platform.env 를 안전하게 Record 로 펼친다(없으면 undefined). */
function envOf(platform: App.Platform | undefined): Record<string, unknown> | undefined {
	return platform?.env as Record<string, unknown> | undefined;
}

/**
 * KV 캐시 바인딩(COFFEE_CACHE). `.get` / `.put` 가 함수일 때만 KVNamespace 로 간주.
 */
export function getCache(platform: App.Platform | undefined): KVNamespace | null {
	const env = envOf(platform);
	const b = env?.COFFEE_CACHE;
	if (b && typeof (b as KVNamespace).get === 'function' && typeof (b as KVNamespace).put === 'function') {
		return b as KVNamespace;
	}
	return null;
}

/**
 * D1 데이터베이스 바인딩(COFFEE_DB). `.prepare` 가 함수일 때만 D1Database 로 간주.
 */
export function getDb(platform: App.Platform | undefined): D1Database | null {
	const env = envOf(platform);
	const b = env?.COFFEE_DB;
	if (b && typeof (b as D1Database).prepare === 'function') {
		return b as D1Database;
	}
	return null;
}

/**
 * ExecutionContext — `waitUntil` 로 응답 후 백그라운드 작업(영속화 등)을 예약할 때 쓴다.
 * `.waitUntil` 가 함수일 때만 반환.
 */
export function getCtx(platform: App.Platform | undefined): ExecutionContext | null {
	const ctx = platform?.ctx as ExecutionContext | undefined;
	if (ctx && typeof ctx.waitUntil === 'function') {
		return ctx;
	}
	return null;
}
