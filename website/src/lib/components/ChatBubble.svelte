<script lang="ts">
	import type { ChatRole } from '$lib/types/proposal';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		role: ChatRole;
		emphasis?: 'normal' | 'error';
		children?: Snippet;
		/** 타자기 효과로 점진 노출할 어시스턴트 텍스트 (지정 시 children 대신 사용). */
		typewriterText?: string;
	}

	let { role, emphasis = 'normal', children, typewriterText }: Props = $props();

	// JS 기반 모션은 전역 CSS의 reduced-motion 규칙으로 막히지 않으므로 직접 감지한다.
	function prefersReducedMotion(): boolean {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// 새 말풍선이 등장할 때만 fly. user 는 오른쪽에서, assistant 는 왼쪽에서 들어온다.
	const flyParams = $derived({
		y: 8,
		x: role === 'user' ? 16 : -16,
		duration: 260,
		easing: cubicOut
	});

	// ── 타자기 노출 ─────────────────────────────────────────────
	// 서버는 스트리밍하지 않는다 — 순수 클라이언트 연출. 한 글자씩 드러내며,
	// reduced-motion 이면 즉시 전체를 보여준다.
	let revealed = $state('');

	onMount(() => {
		if (typewriterText === undefined) return;
		if (prefersReducedMotion()) {
			revealed = typewriterText;
			return;
		}
		// 텍스트 길이에 맞춰 글자당 간격을 조절 — 짧은 문장은 또렷하게, 긴 문장은 빠르게.
		const full = typewriterText;
		const step = full.length > 80 ? 1 : 8;
		const interval = full.length > 80 ? 12 : 18;
		let i = 0;
		const timer = setInterval(() => {
			i = Math.min(full.length, i + step);
			revealed = full.slice(0, i);
			if (i >= full.length) clearInterval(timer);
		}, interval);
		return () => clearInterval(timer);
	});
</script>

<div
	class="flex w-full"
	class:justify-end={role === 'user'}
	class:justify-start={role === 'assistant'}
	in:fly={flyParams}
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
		{#if typewriterText !== undefined}
			{revealed}{#if revealed.length < typewriterText.length}<span
					class="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] animate-pulse bg-current align-middle"
					aria-hidden="true"
				></span>{/if}
		{:else if children}
			{@render children()}
		{/if}
	</div>
</div>
