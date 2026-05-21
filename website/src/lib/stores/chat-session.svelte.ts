/**
 * 채팅 세션 영속화 — 새로고침/탭 전환 시 진행 중인 추천/대화가 날아가던 문제 해결.
 *
 * - localStorage 에 메시지/컨텍스트/원본 카테고리 풀/이미 보여준 라이브러리 id 저장.
 * - SSR 안전(브라우저 가드).
 * - 24시간 지나면 자동 만료 — 어제 본 추천을 다시 띄우는 건 어색.
 * - 저장 실패(private mode) 는 조용히 무시. 메모리만 유지.
 */

import { browser } from '$app/environment';
import type { ChatMessage, ChatContext } from '$lib/types/proposal';
import type { MenuCategory } from '$lib/types/menu';

const STORAGE_KEY = 'chat_session_v1';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface PersistedSession {
	messages: ChatMessage[];
	context: ChatContext;
	originalCategories: MenuCategory[];
	/** 이미 카드로 보여준 라이브러리 id — 다음 추천에서 중복 회피용. */
	shownLibraryIds: string[];
	/** 마지막 응답의 빠른 응답 칩 — 복원 시 정적 폴백으로 떨어지지 않게 함께 저장. */
	serverSuggestions: string[];
	savedAt: number;
}

export function loadSession(): PersistedSession | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<PersistedSession>;
		if (!parsed || typeof parsed !== 'object') return null;
		if (typeof parsed.savedAt !== 'number') return null;
		if (Date.now() - parsed.savedAt > TTL_MS) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) return null;
		return {
			messages: parsed.messages as ChatMessage[],
			context: (parsed.context as ChatContext) ?? { profile: null, constraints: {} },
			originalCategories: Array.isArray(parsed.originalCategories)
				? (parsed.originalCategories as MenuCategory[])
				: [],
			shownLibraryIds: Array.isArray(parsed.shownLibraryIds)
				? parsed.shownLibraryIds.filter((x): x is string => typeof x === 'string')
				: [],
			serverSuggestions: Array.isArray(parsed.serverSuggestions)
				? parsed.serverSuggestions.filter((x): x is string => typeof x === 'string')
				: [],
			savedAt: parsed.savedAt
		};
	} catch {
		return null;
	}
}

export function saveSession(s: Omit<PersistedSession, 'savedAt'>): void {
	if (!browser) return;
	try {
		const payload: PersistedSession = { ...s, savedAt: Date.now() };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// 무시.
	}
}

export function clearSession(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// 무시.
	}
}
