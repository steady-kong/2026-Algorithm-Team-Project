<script lang="ts">
	import { fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Composer from '$lib/components/Composer.svelte';
	import ResultView from '$lib/components/ResultView.svelte';
	import { session } from '$lib/stores/session.svelte';

	let scroller: HTMLDivElement;

	function send(text: string) {
		session.send(text).then(() => {
			queueMicrotask(() => scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }));
		});
	}
</script>

<svelte:head><title>Morgorithm · 취향 커피 추천</title></svelte:head>

<main class="mx-auto max-w-3xl px-4 pb-40 pt-8 min-h-dvh">
	<header class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-2">
			<span class="grid place-items-center size-10 rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)]">
				<Icon name="coffee" size={22} fill />
			</span>
			<div>
				<h1 class="font-extrabold text-xl leading-none">Morgorithm</h1>
				<p class="text-xs text-[var(--color-on-surface-variant)]">AI 후보 · 알고리즘 선택</p>
			</div>
		</div>
		<nav class="flex items-center gap-1">
			{#if session.turns.length > 0}
				<button
					onclick={() => session.reset()}
					class="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition"
				>
					<Icon name="restart_alt" size={18} /> 새로 시작
				</button>
			{/if}
			<a
				href={resolve('/about')}
				class="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm hover:bg-[var(--color-surface-container)] transition"
			>
				<Icon name="schema" size={18} /> 작동 방식
			</a>
		</nav>
	</header>

	<div bind:this={scroller} class="flex flex-col gap-6">
		{#if session.turns.length === 0}
			<div in:fade class="text-center py-12">
				<div class="grid place-items-center size-20 mx-auto rounded-3xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] mb-5">
					<Icon name="coffee_maker" size={40} />
				</div>
				<h2 class="text-2xl font-bold mb-2">오늘 어떤 커피가 당길까요?</h2>
				<p class="text-[var(--color-on-surface-variant)] max-w-md mx-auto">
					한 줄로 취향을 말하면 Upstage AI가 후보를 만들고, 직접 구현한 알고리즘이 점수화·정렬·다양성·배낭·최단경로로
					딱 맞는 커피를 골라줍니다.
				</p>
			</div>
		{/if}

		{#each session.turns as turn, i (i)}
			{#if turn.kind === 'user'}
				<div class="flex justify-end" in:fade>
					<div class="max-w-[80%] rounded-[var(--radius-md3)] rounded-br-md bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-2.5">
						{turn.text}
					</div>
				</div>
			{:else}
				<ResultView result={turn.result} />
			{/if}
		{/each}

		{#if session.loading}
			<div class="flex items-center gap-2 text-[var(--color-on-surface-variant)]" in:fade>
				<Icon name="progress_activity" size={20} class="animate-spin" />
				후보 생성 → 알고리즘 랭킹 중…
			</div>
		{/if}
		{#if session.errorMsg}
			<p class="text-[var(--color-tertiary)] text-sm">{session.errorMsg}</p>
		{/if}
	</div>

	<div class="fixed inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)] to-transparent pt-8 pb-5">
		<div class="mx-auto max-w-3xl px-4">
			<Composer loading={session.loading} isFollowUp={session.target !== null} onsend={send} />
		</div>
	</div>
</main>
