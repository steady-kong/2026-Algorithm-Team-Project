<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Icon from '../Icon.svelte';
	import { knapsack01 } from '$lib/algorithms';

	interface Item {
		name: string;
		cost: number;
		value: number; // 0..1 fit
	}
	const items: Item[] = [
		{ name: '예가체프', cost: 5, value: 0.92 },
		{ name: '콜롬비아', cost: 4, value: 0.74 },
		{ name: '다크 에스프레소', cost: 3, value: 0.5 },
		{ name: '오트 라떼', cost: 6, value: 0.81 },
		{ name: '콜드브루', cost: 4, value: 0.63 }
	];
	const budget = 12;

	const chosen = new SvelteSet<number>();
	const revealed = $derived(chosen.size > 0);
	const usedCost = $derived([...chosen].reduce((s, i) => s + items[i].cost, 0));

	let timers: ReturnType<typeof setTimeout>[] = [];
	function clearTimers() {
		timers.forEach(clearTimeout);
		timers = [];
	}
	onDestroy(clearTimers);

	function run() {
		clearTimers();
		if (revealed) {
			chosen.clear();
			return;
		}
		// staggered reveal for a little drama — uses the real DP from $lib/algorithms
		knapsack01(items, budget).forEach((idx, k) => {
			timers.push(setTimeout(() => chosen.add(idx), k * 350));
		});
	}
</script>

<div class="rounded-2xl bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-outline)]/40">
	<div class="flex flex-col gap-2 mb-3">
		{#each items as item, i (item.name)}
			<div
				class="flex items-center gap-2 px-3 py-2 rounded-xl ring-1 transition-all duration-300 {chosen.has(
					i
				)
					? 'bg-[var(--color-primary-container)] ring-[var(--color-primary)]'
					: 'bg-[var(--color-surface-container)] ring-transparent opacity-70'}"
			>
				<Icon
					name={chosen.has(i) ? 'check_circle' : 'radio_button_unchecked'}
					size={18}
					fill={chosen.has(i)}
					class={chosen.has(i) ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'}
				/>
				<span class="text-sm font-medium">{item.name}</span>
				<span class="ml-auto text-xs text-[var(--color-on-surface-variant)]">비용 {item.cost} · 적합도 {item.value.toFixed(2)}</span>
			</div>
		{/each}
	</div>

	<div class="mb-1 flex justify-between text-xs text-[var(--color-on-surface-variant)]">
		<span>예산 사용</span><span>{usedCost} / {budget}</span>
	</div>
	<div class="h-2 rounded-full bg-[var(--color-outline)]/30 overflow-hidden mb-3">
		<div
			class="h-full bg-[var(--color-primary)] transition-[width] duration-500"
			style="width: {(usedCost / budget) * 100}%"
		></div>
	</div>

	<div class="flex justify-center">
		<button
			onclick={run}
			class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] hover:opacity-90 transition"
		>
			<Icon name={revealed ? 'replay' : 'shopping_bag'} size={16} />
			{revealed ? '초기화' : '예산 내 최적 조합 담기'}
		</button>
	</div>
</div>
