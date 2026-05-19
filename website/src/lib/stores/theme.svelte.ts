/**
 * 테마 상태 ($state rune).
 *
 * - 'auto'  : OS의 prefers-color-scheme 을 따른다 (기본값).
 * - 'light' : 라이트 모드 고정.
 * - 'dark'  : 다크 모드 고정.
 *
 * 변경 시 <html data-theme> 을 갱신하고 localStorage 에 영속화한다.
 */

import { browser } from '$app/environment';

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'theme';

function readInitial(): ThemeMode {
	if (!browser) return 'auto';
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v === 'light' || v === 'dark') return v;
	} catch {
		// localStorage 접근 불가 — auto로 폴백.
	}
	return 'auto';
}

class ThemeStore {
	mode = $state<ThemeMode>(readInitial());

	apply(next: ThemeMode): void {
		this.mode = next;
		if (!browser) return;
		document.documentElement.dataset.theme = next;
		try {
			if (next === 'auto') localStorage.removeItem(STORAGE_KEY);
			else localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// 무시 — 영속화 실패해도 동작 자체는 유지.
		}
	}

	toggle(): void {
		const next: ThemeMode =
			this.mode === 'dark' ? 'light' : this.mode === 'light' ? 'auto' : 'dark';
		this.apply(next);
	}
}

export const theme = new ThemeStore();
