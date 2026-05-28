<script lang="ts">
	import type { Proposal } from '$lib/types/proposal';
	import { CATEGORY_VISUALS, MENU_CATEGORY_LABELS, type MenuCategory } from '$lib/types/menu';
	import { ROAST_LABELS } from '$lib/data/bean-hints';
	import { TASTE_DIMENSION_LABELS } from '$lib/types/taste';
	import RecipeDetail from './RecipeDetail.svelte';

	// 카드 3장을 한눈에 비교할 수 있도록 노출하는 컵 특성 4축. predicted_cup 은 추출 기구·
	// 카테고리·시럽에서 결정적으로 계산돼 후보마다 다르다 (roast_level 은 컵 축이 아니라 제외).
	const CUP_DIMS = [
		['acidity', TASTE_DIMENSION_LABELS.acidity],
		['body', TASTE_DIMENSION_LABELS.body],
		['sweetness', TASTE_DIMENSION_LABELS.sweetness],
		['bitterness', TASTE_DIMENSION_LABELS.bitterness]
	] as const;

	interface Props {
		proposals: Proposal[];
		chosenId: string | null;
		onChoose: (id: string) => void;
	}

	let { proposals, chosenId, onChoose }: Props = $props();

	// 카테고리 누락(예: 라이브러리 외 hybrid) 폴백 — 첫 사용자가 한 눈에 잡힐 시각 단서가 필요.
	const DEFAULT_VISUAL = CATEGORY_VISUALS.black;

	function visualFor(cat: MenuCategory | undefined) {
		if (!cat) return DEFAULT_VISUAL;
		return CATEGORY_VISUALS[cat] ?? DEFAULT_VISUAL;
	}
</script>

<ul class="flex flex-col gap-2.5" role="list" aria-label="추천 메뉴 카드">
	{#each proposals as p, idx (p.id)}
		{@const isChosen = chosenId === p.id}
		{@const isOther = chosenId !== null && !isChosen}
		{@const cat = p.recipe.menu_category}
		{@const v = visualFor(cat)}
		{@const catLabel = cat ? MENU_CATEGORY_LABELS[cat] : '커피'}
		<li>
			<button
				type="button"
				onclick={() => onChoose(p.id)}
				disabled={isChosen}
				aria-pressed={isChosen}
				aria-label={`${idx + 1}번 추천: ${p.name} (${catLabel}). ${p.tagline}`}
				class="flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all"
				class:border-primary={isChosen}
				class:bg-primary-container={isChosen}
				class:text-on-primary-container={isChosen}
				class:border-outline-variant={!isChosen}
				class:bg-surface-container={!isChosen && !isOther}
				class:opacity-40={isOther}
				class:cursor-default={isChosen}
				class:hover:bg-surface-container-high={!isChosen}
			>
				<span
					class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm ring-1 ring-black/5"
					style="background: {v.gradient}"
					aria-hidden="true"
				>
					<span class="drop-shadow-sm">{v.emoji}</span>
					<span
						class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-surface-container"
						class:bg-primary={isChosen}
						class:text-on-primary={isChosen}
						class:bg-surface-container-highest={!isChosen}
						class:text-on-surface={!isChosen}
					>
						{idx + 1}
					</span>
				</span>
				<div class="flex-1 min-w-0">
					<div class="m3-title">{p.name}</div>
					<div class="m3-label mt-0.5 text-on-surface-variant" class:text-on-primary-container={isChosen}>
						{p.tagline}
					</div>
					{#if p.why}
						<div
							class="m3-label mt-1 flex items-center gap-1 text-primary"
							class:text-on-primary-container={isChosen}
							title="추천 알고리즘 적합도 — 사용자가 말한 맛 축 기준"
						>
							<span aria-hidden="true">🎯</span>
							<span>{p.why}</span>
						</div>
					{/if}
					<div class="mt-1.5 flex flex-wrap items-center gap-1">
						{#if cat}
							<span
								class="m3-label inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-0.5 text-on-surface"
							>
								{catLabel}
							</span>
						{/if}
						{#if p.recipe.bean_hint}
							<span
								class="m3-label inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-0.5 text-on-surface"
								title={p.recipe.bean_hint.rationale ?? ''}
							>
								<span aria-hidden="true">🌱</span>
								<span>{p.recipe.bean_hint.origin} · {ROAST_LABELS[p.recipe.bean_hint.roast].ko}</span>
							</span>
						{/if}
						{#if p.kind === 'mod'}
							<span
								class="m3-label inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 text-on-secondary-container"
							>
								<span aria-hidden="true">🛠️</span>
								<span>이 메뉴에 추가</span>
							</span>
						{:else if p.kind === 'alt'}
							<span
								class="m3-label inline-flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 text-on-tertiary-container"
							>
								<span aria-hidden="true">↪️</span>
								<span>다른 메뉴 추천</span>
							</span>
						{/if}
						{#if p.inspired_by && p.inspired_by.length > 0}
							<span
								class="m3-label inline-flex flex-wrap items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 text-on-tertiary-container"
							>
								<span aria-hidden="true">✨</span>
								<span>
									{#if p.inspired_by.length === 1}
										{p.inspired_by[0].name} 기반
									{:else}
										{p.inspired_by.map((x) => x.name).join(' + ')} 조합
									{/if}
								</span>
							</span>
						{/if}
					</div>
					<div
						class="m3-label mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-on-surface-variant"
						class:text-on-primary-container={isChosen}
						aria-label="예상 맛 특성"
					>
						{#each CUP_DIMS as [dim, label] (dim)}
							<span>{label} {p.recipe.predicted_cup[dim]}/5</span>
						{/each}
					</div>
				</div>
				{#if !isChosen}
					<span
						class="m3-label text-on-surface-variant"
						aria-hidden="true">선택 →</span
					>
				{:else}
					<span class="sr-only">선택됨</span>
				{/if}
			</button>
		</li>
	{/each}

	{#if chosenId}
		{@const chosen = proposals.find((p) => p.id === chosenId)}
		{#if chosen}
			<li class="mt-1 list-none">
				<RecipeDetail recipe={chosen.recipe} />
			</li>
		{/if}
	{/if}
</ul>
