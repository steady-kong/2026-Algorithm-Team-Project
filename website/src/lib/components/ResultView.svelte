<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import RecipeCard from './RecipeCard.svelte';
	import TasteRadar from './TasteRadar.svelte';
	import type { RecommendResult } from '$lib/server/recommend';

	interface Props {
		result: RecommendResult;
	}
	const { result }: Props = $props();
	let showFlight = $state(false);
</script>

<section class="flex flex-col gap-5" in:fade={{ duration: 250 }}>
	<!-- header: source + target -->
	<div class="flex flex-wrap items-center gap-3">
		<span
			class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold {result.source ===
			'llm'
				? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
				: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}"
		>
			<Icon name={result.source === 'llm' ? 'auto_awesome' : 'rule'} size={15} />
			{result.source === 'llm' ? 'Upstage AI 생성' : '규칙 기반 폴백'}
		</span>
		<span class="text-sm text-[var(--color-on-surface-variant)]">
			후보를 만들고 알고리즘이 점수화·정렬·다양성으로 골랐어요
		</span>
	</div>

	<div class="grid md:grid-cols-[200px_1fr] gap-5 items-start">
		<!-- target radar -->
		<div
			class="rounded-[var(--radius-md3)] bg-[var(--color-surface-container)] p-3 ring-1 ring-[var(--color-outline)]/50 grid place-items-center"
		>
			<TasteRadar profile={result.target} size={188} />
			<p class="text-xs text-[var(--color-on-surface-variant)] -mt-1">목표 취향 프로파일</p>
		</div>

		<!-- cards -->
		<div class="flex flex-col gap-3">
			{#each result.cards as scored, i (scored.recipe.id)}
				<RecipeCard {scored} delay={i * 90} />
			{/each}
		</div>
	</div>

	<!-- knapsack tasting flight -->
	{#if result.flight.items.length > 0}
		<div class="rounded-[var(--radius-md3)] bg-[var(--color-surface-container)] ring-1 ring-[var(--color-outline)]/50 overflow-hidden">
			<button
				onclick={() => (showFlight = !showFlight)}
				class="w-full flex items-center gap-2 p-4 text-left cursor-pointer"
			>
				<Icon name="local_bar" size={20} />
				<span class="font-semibold">예산 {result.flight.budget}로 짠 시음 세트</span>
				<span class="text-xs text-[var(--color-on-surface-variant)]">0/1 배낭 DP</span>
				<Icon name={showFlight ? 'expand_less' : 'expand_more'} size={20} class="ml-auto" />
			</button>
			{#if showFlight}
				<div class="px-4 pb-4 flex flex-col gap-2" transition:fade={{ duration: 180 }}>
					{#each result.flight.items as it (it.recipe.id)}
						<div class="flex items-center gap-2 text-sm">
							<Icon name="check_circle" size={16} class="text-[var(--color-success)]" />
							<span class="font-medium">{it.recipe.nameKo}</span>
							<span class="text-[var(--color-on-surface-variant)]">· 비용 {it.recipe.cost}</span>
							<span class="ml-auto text-[var(--color-primary)] font-semibold">
								{Math.round(it.score * 100)}%
							</span>
						</div>
					{/each}
					<p class="text-xs text-[var(--color-on-surface-variant)] pt-1">
						총 비용 {result.flight.totalCost} / 예산 {result.flight.budget} · 적합도 합 {result.flight.totalValue.toFixed(
							2
						)} 최대화
					</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- dijkstra journey -->
	{#if result.journey.steps.length > 1}
		<div class="rounded-[var(--radius-md3)] bg-[var(--color-surface-container)] p-4 ring-1 ring-[var(--color-outline)]/50">
			<div class="flex items-center gap-2 mb-3">
				<Icon name="route" size={20} />
				<span class="font-semibold">취향 여정</span>
				<span class="text-xs text-[var(--color-on-surface-variant)]">Dijkstra 최단 경로</span>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#each result.journey.steps as step, i (step.id)}
					<div in:fly={{ x: -10, duration: 300, delay: i * 120 }} class="flex items-center gap-2">
						<span
							class="px-3 py-1.5 rounded-full text-sm bg-[var(--color-surface)] ring-1 ring-[var(--color-outline)]/50"
							>{step.nameKo}</span
						>
						{#if i < result.journey.steps.length - 1}
							<Icon name="arrow_forward" size={16} class="text-[var(--color-on-surface-variant)]" />
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
