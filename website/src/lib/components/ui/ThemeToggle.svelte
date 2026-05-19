<script lang="ts">
	import { theme, type ThemeMode } from '$lib/stores/theme.svelte';

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
</script>

<button
	type="button"
	class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-sm text-on-surface transition-colors hover:bg-surface-container-high"
	onclick={() => theme.toggle()}
	aria-label="테마 전환 (현재: {LABELS[theme.mode]})"
	title="테마 전환 (현재: {LABELS[theme.mode]})"
>
	<span aria-hidden="true">{ICONS[theme.mode]}</span>
	<span class="m3-label">{LABELS[theme.mode]}</span>
</button>
