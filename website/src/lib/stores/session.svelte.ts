import { browser } from '$app/environment';
import type { TasteProfile } from '$lib/types/taste';
import type { RecommendResult } from '$lib/server/recommend';

/**
 * Client-side conversation state (Svelte 5 runes), persisted to localStorage with
 * a 24h TTL. No login required — the taste journey lives entirely in the browser.
 */

export type Turn =
	| { kind: 'user'; text: string }
	| { kind: 'result'; result: RecommendResult };

const STORAGE_KEY = 'morgorithm.session.v1';
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SHOWN_IDS = 40;

interface Persisted {
	turns: Turn[];
	target: TasteProfile | null;
	shownIds: string[];
	savedAt: number;
}

function load(): Persisted | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const p = JSON.parse(raw) as Persisted;
		if (Date.now() - p.savedAt > TTL_MS) return null;
		return p;
	} catch {
		return null;
	}
}

class SessionStore {
	turns = $state<Turn[]>([]);
	target = $state<TasteProfile | null>(null);
	shownIds = $state<string[]>([]);
	loading = $state(false);
	errorMsg = $state<string | null>(null);

	constructor() {
		const p = load();
		if (p) {
			this.turns = p.turns;
			this.target = p.target;
			this.shownIds = p.shownIds;
		}
	}

	private persist() {
		if (!browser) return;
		const data: Persisted = {
			turns: this.turns,
			target: this.target,
			shownIds: this.shownIds,
			savedAt: Date.now()
		};
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch {
			/* quota / disabled storage — non-fatal */
		}
	}

	reset() {
		this.turns = [];
		this.target = null;
		this.shownIds = [];
		this.errorMsg = null;
		if (browser) localStorage.removeItem(STORAGE_KEY);
	}

	private recordResult(result: RecommendResult) {
		this.turns = [...this.turns, { kind: 'result', result }];
		this.target = result.target;
		const newIds = result.cards.map((c) => c.recipe.id);
		// keep only the most recent ids so a long session can't exhaust the catalog
		this.shownIds = [...new Set([...this.shownIds, ...newIds])].slice(-MAX_SHOWN_IDS);
		this.persist();
	}

	async send(text: string) {
		const trimmed = text.trim();
		if (!trimmed || this.loading) return;
		this.errorMsg = null;
		this.turns = [...this.turns, { kind: 'user', text: trimmed }];
		this.loading = true;
		this.persist();

		const isFollowUp = this.target !== null;
		try {
			const res = await fetch(isFollowUp ? '/api/refine' : '/api/recommend', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(
					isFollowUp
						? { message: trimmed, target: this.target, shownIds: this.shownIds }
						: { message: trimmed }
				)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const result = (await res.json()) as RecommendResult;
			this.recordResult(result);
		} catch (e) {
			this.errorMsg = '추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
			console.error(e);
		} finally {
			this.loading = false;
			this.persist();
		}
	}
}

export const session = new SessionStore();
