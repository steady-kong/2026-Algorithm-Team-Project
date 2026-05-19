<script lang="ts">
	import type { Recipe } from '$lib/types/recipe';
	import { GRIND_LABELS } from '$lib/types/recipe';
	import type { TasteProfile } from '$lib/types/taste';
	import {
		MENU_CATEGORY_LABELS,
		MILK_TYPE_LABELS,
		AROMA_LABELS,
		SYRUP_LABELS
	} from '$lib/types/menu';
	import Stars from './ui/Stars.svelte';

	interface Props {
		best: Recipe;
		alternatives: Recipe[];
		profile: TasteProfile;
	}

	let { best, alternatives, profile }: Props = $props();

	const all = $derived([best, ...alternatives]);

	let expandedIdx = $state<number>(0);

	type CupDim = 'acidity' | 'body' | 'sweetness' | 'bitterness';
	const DIM_LABELS: Record<CupDim, string> = {
		acidity: '산미',
		body: '바디',
		sweetness: '단맛',
		bitterness: '쓴맛'
	};
	const DIMS: CupDim[] = ['acidity', 'body', 'sweetness', 'bitterness'];

	function dimDelta(recipe: Recipe, dim: CupDim): string {
		const delta = recipe.predicted_cup[dim] - profile[dim];
		if (delta === 0) return '꼭 맞음';
		if (delta > 0) return `+${delta} 단계 강함`;
		return `${delta} 단계 약함`;
	}
</script>

<div class="flex flex-col gap-3">
	{#each all as recipe, idx (recipe.notes + idx)}
		{@const rank = idx + 1}
		{@const open = expandedIdx === idx}
		<article
			class="overflow-hidden rounded-2xl border transition-colors"
			class:border-primary={idx === 0}
			class:bg-primary-container={idx === 0}
			class:text-on-primary-container={idx === 0}
			class:border-outline-variant={idx !== 0}
			class:bg-surface-container={idx !== 0}
			class:text-on-surface={idx !== 0}
		>
			<button
				type="button"
				onclick={() => (expandedIdx = open ? -1 : idx)}
				class="flex w-full items-center gap-4 p-4 text-left"
				aria-expanded={open}
			>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold"
					class:bg-primary={idx === 0}
					class:text-on-primary={idx === 0}
					class:bg-surface-container-highest={idx !== 0}
				>
					{rank}
				</div>
				<div class="flex-1">
					<div class="m3-title flex flex-wrap items-baseline gap-x-2">
						{#if idx === 0}<span>1순위 추천</span>{/if}
						{#if recipe.menu_category}
							<span
								class="m3-label rounded-full bg-tertiary-container px-2 py-0.5 text-on-tertiary-container"
							>
								{MENU_CATEGORY_LABELS[recipe.menu_category]}
							</span>
						{/if}
						<span class="m3-label opacity-75">적합도 {(recipe.score * 100).toFixed(0)}점</span>
					</div>
					<div class="m3-label opacity-75">
						{GRIND_LABELS[recipe.grind_size]} · {recipe.dose_g}g
						/ 물 {recipe.water_g}g · {recipe.water_temp_c}℃
					</div>
					{#if recipe.milk_type && recipe.milk_type !== 'none'}
						<div class="m3-label opacity-65">
							{MILK_TYPE_LABELS[recipe.milk_type]}{#if recipe.aroma && recipe.aroma !== 'none'}
								· {AROMA_LABELS[recipe.aroma]} 향{/if}{#if recipe.syrups && recipe.syrups.length > 0}
								· {recipe.syrups.map((s) => SYRUP_LABELS[s]).join(', ')} 시럽{/if}
						</div>
					{/if}
				</div>
				<span class="m3-label" aria-hidden="true">{open ? '접기' : '펼치기'}</span>
			</button>

			{#if open}
				<div
					class="border-t px-4 pb-4 pt-3"
					class:border-primary={idx === 0}
					class:border-outline-variant={idx !== 0}
				>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each DIMS as dim (dim)}
							<div class="flex flex-col gap-1">
								<span class="m3-label opacity-75">{DIM_LABELS[dim]}</span>
								<Stars value={recipe.predicted_cup[dim]} label={DIM_LABELS[dim]} />
								<span class="m3-label opacity-60">{dimDelta(recipe, dim)}</span>
							</div>
						{/each}
					</div>

					<ol class="mt-4 flex flex-col gap-2 pl-1">
						{#each recipe.steps as step (step.order)}
							<li class="flex gap-3">
								<span
									class="m3-label mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-on-surface"
								>
									{step.order}
								</span>
								<div class="flex-1">
									<div class="m3-body">{step.description}</div>
									{#if step.duration_sec !== null}
										<div class="m3-label opacity-60">{step.duration_sec}초</div>
									{/if}
								</div>
							</li>
						{/each}
					</ol>

					<p class="m3-label mt-4 opacity-70">{recipe.notes}</p>
				</div>
			{/if}
		</article>
	{/each}
</div>
