<script lang="ts">
	import type { BeanRecommendation } from '$lib/types/bean';

	interface Props {
		recommendation: BeanRecommendation;
	}

	let { recommendation }: Props = $props();
	const { bean, match_score, price_per_100g_krw } = $derived(recommendation);

	const matchPct = $derived(Math.round(match_score * 100));
	const priceText = $derived(price_per_100g_krw.toLocaleString('ko-KR'));

	function safeHttpUrl(raw: string | null): string | null {
		if (!raw) return null;
		try {
			const u = new URL(raw);
			if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
			return null;
		} catch {
			return null;
		}
	}
	const purchaseUrl = $derived(safeHttpUrl(bean.url));
</script>

<article
	class="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container p-4 text-on-surface"
>
	<header class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1">
			<div class="m3-title truncate">{bean.name}</div>
			<div class="m3-label opacity-70">{bean.brand} · {bean.origin}</div>
		</div>
		<div class="text-right">
			<div class="m3-title">{priceText}원</div>
			<div class="m3-label opacity-60">/ 100g</div>
		</div>
	</header>

	<div class="flex flex-wrap gap-1.5">
		{#each bean.flavor_notes as note (note)}
			<span
				class="m3-label rounded-full bg-tertiary-container px-2.5 py-0.5 text-on-tertiary-container"
			>
				{note}
			</span>
		{/each}
	</div>

	<footer class="flex items-center justify-between gap-3">
		<div class="m3-label opacity-75">취향 적합도 {matchPct}%</div>
		{#if purchaseUrl}
			<a
				href={purchaseUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="m3-label rounded-full bg-secondary-container px-3 py-1 text-on-secondary-container hover:brightness-105"
			>
				구매 링크 ↗
			</a>
		{/if}
	</footer>
</article>
