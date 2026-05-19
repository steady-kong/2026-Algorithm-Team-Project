/**
 * 클라이언트 식별자 (UUID v7).
 *
 * 최초 방문 시 한 번 발급해 localStorage 에 보관하고, 이후 모든 API 호출에
 * `X-Client-Id` 헤더로 동봉한다. 서버는 이 ID 를 레이트 리미트 키로 사용한다.
 *
 * SSR 시점에는 빈 문자열, 마운트 후 클라이언트에서 결정된다.
 */

import { browser } from '$app/environment';
import { uuidV7, isUuidV7 } from '$lib/util/uuid';

const STORAGE_KEY = 'client_id';

function readOrCreate(): string {
	if (!browser) return '';
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (isUuidV7(v)) return v;
	} catch {
		// localStorage 비활성 (priv mode / 차단) — 메모리 임시 ID 로 폴백.
	}
	const fresh = uuidV7();
	try {
		localStorage.setItem(STORAGE_KEY, fresh);
	} catch {
		// 무시.
	}
	return fresh;
}

class ClientIdStore {
	value = $state<string>(readOrCreate());
}

export const clientId = new ClientIdStore();

/**
 * `fetch` 래퍼 — 자동으로 `X-Client-Id` 헤더를 붙인다.
 * Content-Type 은 호출 측에서 설정.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	if (clientId.value) headers.set('x-client-id', clientId.value);
	return fetch(input, { ...init, headers });
}
