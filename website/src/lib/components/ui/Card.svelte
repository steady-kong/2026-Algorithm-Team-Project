<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'elevated' | 'filled' | 'outlined';
		class?: string;
		children: Snippet;
	}

	let { variant = 'elevated', class: cls = '', children }: Props = $props();

	const base = 'rounded-2xl p-5 transition-shadow';
	const variantCls = {
		elevated: 'bg-surface-container text-on-surface shadow-[var(--m3-shadow)]',
		filled: 'bg-surface-container-high text-on-surface',
		outlined: 'bg-surface text-on-surface border border-outline-variant'
	};
</script>

<div class="{base} {variantCls[variant]} {cls}">
	{@render children()}
</div>
