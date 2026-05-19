<script lang="ts">
	import type { ChatRole } from '$lib/types/proposal';
	import type { Snippet } from 'svelte';

	interface Props {
		role: ChatRole;
		emphasis?: 'normal' | 'error';
		children: Snippet;
	}

	let { role, emphasis = 'normal', children }: Props = $props();
</script>

<div
	class="flex w-full"
	class:justify-end={role === 'user'}
	class:justify-start={role === 'assistant'}
>
	<div
		class="max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed"
		class:bg-primary={role === 'user'}
		class:text-on-primary={role === 'user'}
		class:rounded-br-sm={role === 'user'}
		class:bg-surface-container-highest={role === 'assistant' && emphasis === 'normal'}
		class:text-on-surface={role === 'assistant' && emphasis === 'normal'}
		class:rounded-bl-sm={role === 'assistant'}
		class:bg-error-container={role === 'assistant' && emphasis === 'error'}
		class:text-on-error-container={role === 'assistant' && emphasis === 'error'}
	>
		{@render children()}
	</div>
</div>
