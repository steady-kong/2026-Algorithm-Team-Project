<script lang="ts">
	import { theme, type ThemeMode } from '$lib/stores/theme.svelte';
	import { fly } from 'svelte/transition';
	import { duration, easing, prefersReducedMotion } from '$lib/util/motion';

	const LABELS: Record<ThemeMode, string> = {
		auto: '자동',
		light: '라이트',
		dark: '다크'
	};
	const ICONS: Record<ThemeMode, string> = {
		auto: '🌗',
		light: '☀️',
		dark: '🌙'
	};

	// JS 기반 transition 은 전역 CSS reduced-motion 규칙으로 막히지 않으므로
	// 파라미터 단계에서 직접 무력화한다. 0 길이면 즉시 교체된다.
	const reduce = prefersReducedMotion();
	// auto→dark→… 순환에서 회전하듯 아이콘이 위로 흘러 들어오게 한다.
	const spin = $derived({
		y: reduce ? 0 : 10,
		duration: reduce ? 0 : duration.fast,
		easing: easing.standard
	});
</script>

<button
	type="button"
	class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-sm text-on-surface transition-[background-color,transform] duration-150 hover:bg-surface-container-high active:scale-90"
	onclick={() => theme.toggle()}
	aria-label="테마 전환 (현재: {LABELS[theme.mode]})"
	title="테마 전환 (현재: {LABELS[theme.mode]})"
>
	<!-- 아이콘·라벨을 모드별로 keyed 블록으로 감싸 모드가 바뀔 때마다 새로 들어오게 한다. -->
	<span class="grid h-5 w-5 place-items-center overflow-hidden" aria-hidden="true">
		{#key theme.mode}
			<span class="col-start-1 row-start-1" in:fly={spin}>{ICONS[theme.mode]}</span>
		{/key}
	</span>
	<span class="m3-label grid overflow-hidden">
		{#key theme.mode}
			<span class="col-start-1 row-start-1" in:fly={spin}>{LABELS[theme.mode]}</span>
		{/key}
	</span>
</button>
