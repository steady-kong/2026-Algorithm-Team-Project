/**
 * 보안 가드 (서버 전용).
 *
 * - same-origin 정책: SvelteKit 기본 CSRF 보호는 form-encoded 만 가드하므로,
 *   JSON POST 는 Origin / Sec-Fetch-Site 헤더를 직접 검사한다.
 * - 응답 보안 헤더: HSTS, X-Content-Type-Options, Referrer-Policy 등 일괄 적용
 *   ([hooks.server.ts](../../hooks.server.ts) 에서 호출).
 */

import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export function requireSameOrigin(event: RequestEvent): void {
	const fetchSite = event.request.headers.get('sec-fetch-site');
	if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site' && fetchSite !== 'none') {
		throw error(403, 'cross-site request blocked');
	}

	const origin = event.request.headers.get('origin');
	if (origin) {
		try {
			const incoming = new URL(origin);
			if (incoming.host !== event.url.host) {
				throw error(403, 'origin mismatch');
			}
		} catch {
			throw error(403, 'invalid origin');
		}
	}
}

export const SECURITY_HEADERS: Record<string, string> = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Cross-Origin-Opener-Policy': 'same-origin',
	// 모든 응답(HTML/JSON/asset)에 적용 — robots.txt 보다 우선되는 강제 시그널.
	'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex'
};

export function applySecurityHeaders(headers: Headers): void {
	for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(k)) headers.set(k, v);
	}
}
