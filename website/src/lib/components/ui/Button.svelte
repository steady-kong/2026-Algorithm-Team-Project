<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'filled' | 'tonal' | 'outlined' | 'text';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		children: Snippet;
	}

	let { variant = 'filled', size = 'md', class: cls = '', children, ...rest }: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all ' +
		'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
	const sizeCls: Record<Size, string> = {
		sm: 'h-9 px-4 text-sm',
		md: 'h-11 px-6 text-[15px]',
		lg: 'h-12 px-7 text-base'
	};
	const variantCls: Record<Variant, string> = {
		filled: 'bg-primary text-on-primary hover:shadow-md hover:brightness-105',
		tonal:
			'bg-secondary-container text-on-secondary-container hover:brightness-105',
		outlined:
			'border border-outline text-primary hover:bg-primary/8',
		text: 'text-primary hover:bg-primary/8'
	};
</script>

<button class="{base} {sizeCls[size]} {variantCls[variant]} {cls}" {...rest}>
	{@render children()}
</button>
