<script lang="ts">
	import { slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Icon from './Icon.svelte';
	import { TASTE_AXES, AXIS_LABEL } from '$lib/types/taste';
	import { BREW_LABEL, ROAST_LABEL, type ScoredRecipe } from '$lib/types/recipe';

	interface Props {
		scored: ScoredRecipe;
		delay?: number;
	}
	const { scored, delay = 0 }: Props = $props();
	const r = $derived(scored.recipe);
	const pct = $derived(Math.round(scored.score * 100));

	let open = $state(false);

	const methodIcon: Record<string, string> = {
		espresso: 'coffee',
		pour_over: 'filter_alt',
		french_press: 'science',
		cold_brew: 'ac_unit',
		aeropress: 'compress',
		moka_pot: 'outdoor_grill',
		latte: 'local_cafe'
	};
</script>

<article
	in:fly={{ y: 24, duration: 420, delay, easing: quintOut }}
	class="group rounded-[var(--radius-md3)] bg-[var(--color-surface-container)] shadow-[var(--shadow-md3)] ring-1 ring-[var(--color-outline)]/50 overflow-hidden transition hover:shadow-[var(--shadow-md3-lg)]"
>
	<button
		onclick={() => (open = !open)}
		class="w-full text-left p-5 flex flex-col gap-3 cursor-pointer"
		aria-expanded={open}
	>
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-center gap-3">
				<span
					class="grid place-items-center size-11 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
				>
					<Icon name={methodIcon[r.method] ?? 'local_cafe'} size={24} />
				</span>
				<div>
					<h3 class="font-bold text-lg leading-tight">{r.nameKo}</h3>
					<p class="text-sm text-[var(--color-on-surface-variant)]">
						{BREW_LABEL[r.method]} · {r.bean.origin}
					</p>
				</div>
			</div>
			<div class="text-right shrink-0">
				<div class="text-2xl font-extrabold text-[var(--color-primary)]">{pct}%</div>
				<div class="text-[11px] text-[var(--color-on-surface-variant)]">취향 적합도</div>
			</div>
		</div>

		<!-- mini taste bars -->
		<div class="grid grid-cols-4 gap-2 mt-1">
			{#each TASTE_AXES as axis (axis)}
				<div class="flex flex-col gap-1">
					<span class="text-[11px] text-[var(--color-on-surface-variant)]">{AXIS_LABEL[axis]}</span>
					<div class="h-1.5 rounded-full bg-[var(--color-outline)]/40 overflow-hidden">
						<div
							class="h-full rounded-full bg-[var(--color-secondary)] transition-[width] duration-500"
							style="width: {(r.profile[axis] / 5) * 100}%"
						></div>
					</div>
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-3 text-xs text-[var(--color-on-surface-variant)]">
			<span class="inline-flex items-center gap-1"><Icon name="payments" size={15} />{r.cost} 단위</span>
			<span class="inline-flex items-center gap-1"><Icon name="schedule" size={15} />{r.brewTimeMin}분</span>
			<span class="inline-flex items-center gap-1 ml-auto text-[var(--color-primary)]">
				{open ? '접기' : '레시피 보기'}
				<Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
			</span>
		</div>
	</button>

	{#if open}
		<div transition:slide={{ duration: 280 }} class="px-5 pb-5">
			<div class="rounded-2xl bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-outline)]/40">
				{#if r.story}
					<p class="text-sm text-[var(--color-on-surface-variant)] mb-3 italic">“{r.story}”</p>
				{/if}
				<div class="flex items-center gap-2 mb-2 text-sm font-semibold">
					<Icon name="menu_book" size={18} /> 추출 단계 · 로스팅 {ROAST_LABEL[r.bean.roast]}
				</div>
				<ol class="flex flex-col gap-2">
					{#each r.steps as step, i (i)}
						<li class="flex gap-3 text-sm">
							<span
								class="grid place-items-center size-6 shrink-0 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs font-bold"
								>{i + 1}</span
							>
							<span class="pt-0.5">{step}</span>
						</li>
					{/each}
				</ol>
			</div>
		</div>
	{/if}
</article>
