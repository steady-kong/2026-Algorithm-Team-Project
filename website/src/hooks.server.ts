/**
 * 서버 훅 (모든 요청 진입점).
 *
 * - 모든 응답에 보안 헤더(HSTS, X-Content-Type-Options 등)를 일괄 적용한다.
 * - 에러 메시지가 클라이언트로 그대로 새지 않도록 핸들링한다.
 */

import type { Handle, HandleServerError } from '@sveltejs/kit';
import { applySecurityHeaders } from '$lib/server/security';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	applySecurityHeaders(response.headers);
	return response;
};

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	console.error(`[error ${status}] ${event.request.method} ${event.url.pathname}`, error);
	return {
		message: status && status < 500 ? message : '요청 처리 중 오류가 발생했습니다.'
	};
};
