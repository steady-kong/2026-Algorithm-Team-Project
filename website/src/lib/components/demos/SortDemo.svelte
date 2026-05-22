<script lang="ts">
	import { flip } from 'svelte/animate';
	import Icon from '../Icon.svelte';
	import { mergeSort } from '$lib/algorithms';

	interface Bar {
		id: number;
		value: number;
	}

	function randomBars(): Bar[] {
		return Array.from({ length: 7 }, (_, i) => ({ id: i, value: Math.round(20 + Math.random() * 80) }));
	}

	let bars = $state<Bar[]>(randomBars());
	let sorted = $state(false);

	function toggle() {
		if (sorted) {
			bars = randomBars();
			sorted = false;
		} else {
			bars = mergeSort(bars, (b) => b.value, true);
			sorted = true;
		}
	}
</script>

<div class="rounded-2xl bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-outline)]/40">
	<div class="flex items-end justify-center gap-2 h-32">
		{#each bars as bar (bar.id)}
			<div
				animate:flip={{ duration: 480 }}
				class="w-9 rounded-t-lg bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-secondary)] grid place-items-start justify-center pt-1 text-[10px] font-bold text-white"
				style="height: {bar.value}%"
			>
				{bar.value}
			</div>
		{/each}
	</div>
	<div class="flex justify-center mt-3">
		<button
			onclick={toggle}
			class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] hover:opacity-90 transition"
		>
			<Icon name={sorted ? 'shuffle' : 'sort'} size={16} />
			{sorted ? '다시 섞기' : '적합도 내림차순 정렬'}
		</button>
	</div>
</div>
