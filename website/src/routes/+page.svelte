<script lang="ts">
	import { onMount, tick } from 'svelte';
	import ChatBubble from '$lib/components/ChatBubble.svelte';
	import ProposalCards from '$lib/components/ProposalCards.svelte';
	import RecipeDetail from '$lib/components/RecipeDetail.svelte';
	import Composer from '$lib/components/Composer.svelte';
	import { apiFetch } from '$lib/stores/client-id.svelte';
	import { loadSession, saveSession, clearSession } from '$lib/stores/chat-session.svelte';
	import type { ChatMessage, ChatContext, Proposal, TurnLite } from '$lib/types/proposal';
	import type { Recipe } from '$lib/types/recipe';
	import type { TasteProfile } from '$lib/types/taste';
	import type { Constraints } from '$lib/types/constraints';
	import { type BrewMethod } from '$lib/types/brew';
	import { type MenuCategory } from '$lib/types/menu';

	const GREETING =
		'👋 안녕하세요! 분위기·온도·맛 같은 걸 편하게 한 줄로 말씀해주세요.';

	const QUICK_REPLIES_INITIAL = [
		'따뜻하고 진한 거',
		'시원하고 달콤한 거',
		'산미 있는 거',
		'우유 부드러운 거',
		'디저트처럼 달콤하게'
	];

	const QUICK_REPLIES_AFTER_RECIPE = [
		'다른 거 또 보여줘',
		'오트 우유로 바꿔줘',
		'좀 더 진하게',
		'덜 달게',
		'아이스로 바꿔줘'
	];

	let messages = $state<ChatMessage[]>([
		{ kind: 'text', role: 'assistant', text: GREETING }
	]);
	let context = $state<ChatContext>({ profile: null, constraints: {} });
	let busy = $state(false);
	// 첫 proposals 때 한 번만 고정 — 사용자의 원래 선호 카테고리 풀.
	// refine 시 이걸 보내 다양성 유지에 사용 (그래도 한 메뉴에 갇히지 않게 서버가 알아서).
	let originalCategories = $state<MenuCategory[]>([]);
	// 서버가 매 응답마다 내려주는 컨텍스트 기반 빠른 응답 칩.
	// 없으면 아래의 정적 fallback 으로 폴백.
	let serverSuggestions = $state<string[]>([]);
	// 이미 카드로 보여준 라이브러리 id — 다음 추천에서 "또 같은 메뉴" 회피용.
	let shownLibraryIds = $state<string[]>([]);
	let restoredNotice = $state(false);

	let scrollContainer: HTMLDivElement | null = $state(null);
	async function scrollToBottom() {
		await tick();
		if (scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	}

	onMount(() => {
		// 마지막 세션 복원 — 새로고침/탭 닫기 후에도 진행 중이던 추천이 살아남도록.
		const restored = loadSession();
		if (restored && restored.messages.length > 1) {
			messages = restored.messages;
			context = restored.context;
			originalCategories = restored.originalCategories;
			shownLibraryIds = restored.shownLibraryIds;
			// 복원 시 마지막 칩도 함께 살려, 하단 추천 질문이 정적 폴백으로 떨어지지 않게 한다.
			serverSuggestions = restored.serverSuggestions;
			restoredNotice = true;
			void scrollToBottom();
		}

		// 모바일 키보드가 올라오면 visualViewport 가 줄어든다 — 그에 맞춰 채팅 끝으로 스크롤.
		const vv = typeof window !== 'undefined' ? window.visualViewport : null;
		const onResize = () => void scrollToBottom();
		vv?.addEventListener('resize', onResize);
		return () => vv?.removeEventListener('resize', onResize);
	});

	// 매 messages/context 변경마다 영속화 — 작은 prefer-side-effect 패턴.
	$effect(() => {
		// greeting 만 있을 땐 굳이 저장 안 함.
		if (messages.length <= 1) return;
		saveSession({
			messages,
			context,
			originalCategories,
			shownLibraryIds,
			serverSuggestions
		});
	});

	// 마지막 proposals/recipe 가 있으면 refine 모드, 아니면 propose 모드.
	function lastRecipe(): Recipe | null {
		for (let i = messages.length - 1; i >= 0; i--) {
			const m = messages[i];
			if (m.kind === 'recipe') return m.recipe;
			if (m.kind === 'proposals' && m.chosenId) {
				const p = m.proposals.find((q) => q.id === m.chosenId);
				if (p) return p.recipe;
			}
		}
		return null;
	}

	/** 사용자가 마지막으로 고른 proposal — refine 의 mod 베이스로 서버에 보낸다. */
	function lastChosenProposal(): Proposal | null {
		for (let i = messages.length - 1; i >= 0; i--) {
			const m = messages[i];
			if (m.kind === 'proposals' && m.chosenId) {
				const p = m.proposals.find((q) => q.id === m.chosenId);
				if (p) return p;
			}
		}
		return null;
	}

	function lastChosenBrew(): BrewMethod | null {
		const r = lastRecipe();
		return r?.brew_method ?? null;
	}

	function firstProposalsCategories(): MenuCategory[] {
		// 가장 **처음** proposals 의 카테고리들을 원본 선호 풀로 사용.
		// (마지막이 아니라 첫 set 을 기준 — 사용자의 원래 의도를 보존하기 위함.)
		for (let i = 0; i < messages.length; i++) {
			const m = messages[i];
			if (m.kind === 'proposals') {
				const cats = m.proposals
					.map((p) => p.recipe.menu_category)
					.filter((c): c is MenuCategory => !!c);
				return Array.from(new Set(cats));
			}
		}
		return [];
	}

	function recentTurns(): TurnLite[] {
		const out: TurnLite[] = [];
		for (let i = messages.length - 1; i >= 0 && out.length < 6; i--) {
			const m = messages[i];
			if (m.kind === 'text' || m.kind === 'error') {
				out.unshift({ role: m.role, text: m.text });
			} else if (m.kind === 'proposals') {
				const lines = m.proposals.map((p, idx) => `${idx + 1}. ${p.name} — ${p.tagline}`);
				out.unshift({ role: 'assistant', text: lines.join('\n') });
			} else if (m.kind === 'recipe') {
				out.unshift({ role: 'assistant', text: `선택한 레시피: ${m.recipe.menu_category ?? m.recipe.brew_method}` });
			}
		}
		return out;
	}

	function collectInspiredIds(proposals: Proposal[]): string[] {
		const ids: string[] = [];
		for (const p of proposals) {
			if (!p.inspired_by) continue;
			for (const ib of p.inspired_by) ids.push(ib.id);
		}
		return ids;
	}

	async function handleRateLimit(res: Response): Promise<string | null> {
		if (res.status !== 429) return null;
		let retryAfter = Number(res.headers.get('Retry-After')) || 60;
		try {
			const j = (await res.json()) as { retry_after?: number };
			if (typeof j.retry_after === 'number') retryAfter = j.retry_after;
		} catch {
			// fallthrough
		}
		return `요청이 너무 잦아요. ${retryAfter}초 후 다시 시도해주세요.`;
	}

	/** 서버 4xx 에러를 사용자가 행동할 수 있는 한국어 문구로 변환. */
	async function errorMessageFor(res: Response): Promise<string> {
		// 모든 추출 실패가 같은 문구로 깔리면 어디서 막혔는지 모름 — 코드별 분기.
		try {
			const j = (await res.clone().json()) as { error?: string; message?: string; hint?: string };
			const raw = j.hint ?? j.message ?? j.error ?? '';
			if (typeof raw === 'string' && /[가-힣]/.test(raw)) return raw;
		} catch {
			// JSON 아닌 응답 — 상태 코드로만 분기.
		}
		if (res.status === 400) return '입력을 다시 확인해주세요. 한 줄로 짧게 적어도 괜찮아요.';
		if (res.status === 413) return '입력이 너무 길어요. 300자 안으로 줄여주세요.';
		if (res.status === 415) return '브라우저가 요청을 막은 것 같아요. 페이지를 새로고침해주세요.';
		if (res.status >= 500) return '서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요.';
		return '잠시 문제가 있었어요. 다시 시도해주세요.';
	}

	async function send(text: string) {
		if (busy) return;
		busy = true;
		restoredNotice = false;
		messages = [...messages, { kind: 'text', role: 'user', text }];
		await scrollToBottom();

		try {
			const recipe = lastRecipe();
			if (recipe) {
				await runRefine(text);
			} else {
				await runPropose();
			}
		} catch (e) {
			console.error(e);
			messages = [
				...messages,
				{ kind: 'error', role: 'assistant', text: '잠시 문제가 있었어요. 다시 시도해주세요.' }
			];
		} finally {
			busy = false;
			await scrollToBottom();
		}
	}

	async function runPropose() {
		const res = await apiFetch('/api/chat/propose', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				messages: recentTurns(),
				context: { profile: context.profile, constraints: context.constraints },
				exclude_ids: shownLibraryIds
			})
		});
		const rateMsg = await handleRateLimit(res);
		if (rateMsg) {
			messages = [...messages, { kind: 'error', role: 'assistant', text: rateMsg }];
			return;
		}
		if (!res.ok) {
			const msg = await errorMessageFor(res);
			messages = [...messages, { kind: 'error', role: 'assistant', text: msg }];
			return;
		}
		const data = (await res.json()) as {
			assistant: string;
			proposals: Proposal[];
			context: { profile: TasteProfile | null; constraints: Constraints };
			suggestions?: string[];
		};
		context = data.context;
		serverSuggestions = data.suggestions ?? [];
		if (data.proposals.length === 0) {
			messages = [...messages, { kind: 'text', role: 'assistant', text: data.assistant }];
			return;
		}
		// 첫 proposals 일 때 originalCategories 고정 (이후 refine 의 다양성 기준).
		if (originalCategories.length === 0) {
			const cats = data.proposals
				.map((p) => p.recipe.menu_category)
				.filter((c): c is MenuCategory => !!c);
			originalCategories = Array.from(new Set(cats));
		}
		// 보여준 라이브러리 id 누적 (#16 동일 추천 반복 회피).
		const newIds = collectInspiredIds(data.proposals);
		if (newIds.length > 0) {
			shownLibraryIds = Array.from(new Set([...shownLibraryIds, ...newIds])).slice(-30);
		}
		messages = [
			...messages,
			{ kind: 'text', role: 'assistant', text: data.assistant },
			{ kind: 'proposals', role: 'assistant', proposals: data.proposals, chosenId: null }
		];
	}

	async function runRefine(message: string) {
		const recipe = lastRecipe();
		if (!recipe) return;
		const chosen = lastChosenProposal();
		const brew = lastChosenBrew() ?? recipe.brew_method;
		// 원래 사용자가 호감을 보인 카테고리 풀 (첫 proposals 기준).
		// 서버는 이걸 좁히기에 쓰지 않고 soft 선호도로만 본다.
		const categories =
			originalCategories.length > 0 ? originalCategories : firstProposalsCategories();
		const profile =
			context.profile ?? {
				acidity: 3,
				body: 3,
				sweetness: 3,
				bitterness: 3,
				roast_level: 3
			};

		const res = await apiFetch('/api/chat/refine', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				message,
				exclude_ids: shownLibraryIds,
				context: {
					profile,
					brew_method: brew,
					categories,
					constraints: context.constraints,
					// 선택한 메뉴를 서버에 넘겨서, 서버가 새 메뉴로 갈아치우는 대신 현재 메뉴를 변형(mod)할 수 있게 한다.
					chosen_recipe: chosen?.recipe ?? recipe,
					chosen_name: chosen?.name ?? recipe.display_name
				}
			})
		});
		const rateMsg = await handleRateLimit(res);
		if (rateMsg) {
			messages = [...messages, { kind: 'error', role: 'assistant', text: rateMsg }];
			return;
		}
		if (!res.ok) {
			const msg = await errorMessageFor(res);
			messages = [...messages, { kind: 'error', role: 'assistant', text: msg }];
			return;
		}
		const data = (await res.json()) as {
			assistant: string;
			profile: TasteProfile;
			constraints: Constraints;
			brew_method: BrewMethod;
			categories: MenuCategory[];
			proposals?: Proposal[];
			recipes:
				| { best: Recipe; alternatives: Recipe[] }
				| null;
			suggestions?: string[];
		};
		context = { profile: data.profile, constraints: data.constraints };
		serverSuggestions = data.suggestions ?? [];

		const meaningfulText = data.assistant?.trim() || '요청을 반영했어요.';
		const incomingProposals = data.proposals ?? [];
		if (incomingProposals.length > 0) {
			const newIds = collectInspiredIds(incomingProposals);
			if (newIds.length > 0) {
				shownLibraryIds = Array.from(new Set([...shownLibraryIds, ...newIds])).slice(-30);
			}
			messages = [
				...messages,
				{ kind: 'text', role: 'assistant', text: meaningfulText },
				{
					kind: 'proposals',
					role: 'assistant',
					proposals: incomingProposals,
					chosenId: null
				}
			];
		} else {
			messages = [
				...messages,
				{ kind: 'text', role: 'assistant', text: meaningfulText }
			];
		}
	}

	function chooseProposal(messageIdx: number, proposalId: string) {
		const msg = messages[messageIdx];
		if (!msg || msg.kind !== 'proposals') return;
		const next = messages.slice();
		next[messageIdx] = { ...msg, chosenId: proposalId };
		messages = next;
	}

	function resetChat() {
		// 첫 인사 외에 무언가 진행되었을 때만 확인. 빈 상태에서 실수로 눌러도 손해 없음.
		const hasProgress = messages.length > 1;
		if (hasProgress && !confirm('진행 중인 대화가 사라져요. 정말 새로 시작할까요?')) {
			return;
		}
		messages = [{ kind: 'text', role: 'assistant', text: GREETING }];
		context = { profile: null, constraints: {} };
		originalCategories = [];
		serverSuggestions = [];
		shownLibraryIds = [];
		restoredNotice = false;
		clearSession();
	}

	// 서버가 컨텍스트에 맞춰 내려주는 칩을 1순위로 — 항상 클릭 가능한 다음 액션이 보이도록.
	// 서버가 못 줄 때만 정적 fallback (초기 인사 / 레시피 표시 후) 사용.
	const quickReplies = $derived.by(() => {
		if (serverSuggestions.length > 0) return serverSuggestions;
		const hasRecipe = messages.some(
			(m) => m.kind === 'recipe' || (m.kind === 'proposals' && m.chosenId)
		);
		const hasAnyUser = messages.some((m) => m.kind === 'text' && m.role === 'user');
		if (hasRecipe) return QUICK_REPLIES_AFTER_RECIPE;
		if (!hasAnyUser) return QUICK_REPLIES_INITIAL;
		return QUICK_REPLIES_AFTER_RECIPE;
	});
</script>

<section class="flex flex-1 flex-col" aria-label="채팅 추천">
	{#if restoredNotice}
		<div
			class="mb-2 flex items-center justify-between gap-3 rounded-xl bg-secondary-container px-3 py-2 text-on-secondary-container"
			role="status"
		>
			<span class="m3-label">이전에 보던 대화를 이어서 보여드릴게요.</span>
			<button
				type="button"
				onclick={resetChat}
				class="m3-label rounded-full px-2 py-0.5 underline-offset-2 hover:underline"
			>
				새로 시작
			</button>
		</div>
	{/if}

	<div
		bind:this={scrollContainer}
		class="flex-1 overflow-y-auto"
		aria-live="polite"
		aria-atomic="false"
	>
		<div class="mx-auto flex max-w-2xl flex-col gap-3 pb-6">
			{#each messages as msg, idx (idx)}
				{#if msg.kind === 'text'}
					<ChatBubble role={msg.role}>{msg.text}</ChatBubble>
				{:else if msg.kind === 'error'}
					<ChatBubble role="assistant" emphasis="error">{msg.text}</ChatBubble>
				{:else if msg.kind === 'proposals'}
					<div class="w-full">
						<ProposalCards
							proposals={msg.proposals}
							chosenId={msg.chosenId}
							onChoose={(id) => chooseProposal(idx, id)}
						/>
					</div>
				{:else if msg.kind === 'recipe'}
					<RecipeDetail recipe={msg.recipe} />
				{/if}
			{/each}

			{#if busy}
				<ChatBubble role="assistant">
					<span class="inline-flex gap-1">
						<span class="m3-label text-on-surface-variant">생각 중</span>
						<span aria-hidden="true">…</span>
					</span>
				</ChatBubble>
			{/if}
		</div>
	</div>

	<div class="sticky bottom-0 mt-2 border-t border-outline-variant bg-background/95 py-3 backdrop-blur">
		<div class="mx-auto max-w-2xl">
			<Composer {busy} onSend={send} {quickReplies} placeholder="예) 달콤하고 부드러운 따뜻한 커피" />
			<div class="mt-2 flex justify-end">
				<button
					type="button"
					onclick={resetChat}
					disabled={busy || messages.length <= 1}
					class="m3-label rounded-full px-2 py-1 text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40"
					aria-label="대화 새로 시작하기"
				>
					대화 새로 시작
				</button>
			</div>
		</div>
	</div>
</section>
