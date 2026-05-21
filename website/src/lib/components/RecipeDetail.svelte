<script lang="ts">
	import type { Recipe } from '$lib/types/recipe';
	import {
		deriveIngredients,
		deriveSteps,
		formatDuration,
		recipeTitle,
		totalTimeText
	} from '$lib/util/recipe-detail';
	import { BREW_METHOD_LABELS } from '$lib/types/brew';
	import { TEMPERATURE_LABELS } from '$lib/types/menu';

	interface Props {
		recipe: Recipe;
	}

	let { recipe }: Props = $props();

	const ingredients = $derived(deriveIngredients(recipe));
	const steps = $derived(deriveSteps(recipe));
	const title = $derived(recipeTitle(recipe));
	const total = $derived(totalTimeText(recipe));
</script>

<article class="flex flex-col gap-4 rounded-2xl bg-surface-container p-4 text-on-surface">
	<header class="flex flex-wrap items-baseline justify-between gap-2">
		<div>
			<h3 class="m3-headline">{title}</h3>
			<p class="m3-label opacity-75">
				{BREW_METHOD_LABELS[recipe.brew_method]}
				{#if recipe.temperature}· {TEMPERATURE_LABELS[recipe.temperature]}{/if}
				· 총 {total}
			</p>
		</div>
	</header>

	<section>
		<h4 class="m3-title mb-2">준비물</h4>
		<ul class="flex flex-col gap-1.5">
			{#each ingredients as ing, i (i)}
				<li class="flex items-baseline gap-2">
					<span aria-hidden="true">{ing.icon}</span>
					<span class="m3-body font-medium">{ing.label}</span>
					<span class="m3-label opacity-75">{ing.detail}</span>
				</li>
			{/each}
		</ul>
		{#if recipe.bean_hint?.rationale}
			<p class="m3-label mt-2 text-on-surface-variant">
				💡 {recipe.bean_hint.rationale}
			</p>
		{/if}
	</section>

	<section>
		<h4 class="m3-title mb-2">단계</h4>
		<ol class="flex flex-col gap-2">
			{#each steps as step (step.order)}
				<li class="flex gap-3">
					<span
						class="m3-label mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-container-highest"
					>
						{step.order}
					</span>
					<div class="flex-1">
						<div class="m3-body">{step.description}</div>
						{#if step.duration_sec !== null}
							<div class="m3-label opacity-60">
								{step.duration_sec >= 60
									? formatDuration(step.duration_sec)
									: `${step.duration_sec}초`}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</section>

</article>
