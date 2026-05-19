<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		label?: string;
	}

	let { value, max = 5, label }: Props = $props();

	const cells = $derived(
		Array.from({ length: max }, (_, i) => ({ idx: i, filled: i < Math.round(value) }))
	);
</script>

<span class="inline-flex items-center gap-0.5" aria-label="{label ?? ''} {value} / {max}">
	{#each cells as cell (cell.idx)}
		<span
			class="inline-block size-3 rounded-full"
			class:bg-primary={cell.filled}
			class:bg-outline-variant={!cell.filled}
			aria-hidden="true"
		></span>
	{/each}
</span>
