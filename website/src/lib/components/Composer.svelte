<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		loading: boolean;
		isFollowUp: boolean;
		onsend: (text: string) => void;
	}
	const { loading, isFollowUp, onsend }: Props = $props();

	let text = $state('');

	const firstChips = [
		'달콤하고 부드러운 따뜻한 거',
		'산미 있는 상큼한 핸드드립',
		'진하고 묵직한 에스프레소',
		'안 쓰고 고소한 라떼'
	];
	const followChips = ['더 진하게', '덜 쓰게', '더 달게', '산미 더', '다른 거 또 보여줘'];
	const chips = $derived(isFollowUp ? followChips : firstChips);

	function submit() {
		const t = text.trim();
		if (!t || loading) return;
		onsend(t);
		text = '';
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap gap-2">
		{#each chips as chip (chip)}
			<button
				onclick={() => onsend(chip)}
				disabled={loading}
				class="px-3.5 py-1.5 rounded-full text-sm bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] ring-1 ring-[var(--color-outline)]/50 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition disabled:opacity-50"
			>
				{chip}
			</button>
		{/each}
	</div>

	<div
		class="flex items-end gap-2 rounded-[var(--radius-md3)] bg-[var(--color-surface-container)] p-2 shadow-[var(--shadow-md3)] ring-1 ring-[var(--color-outline)]/50 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/60 transition"
	>
		<textarea
			bind:value={text}
			onkeydown={onKey}
			rows="1"
			placeholder={isFollowUp ? '취향을 더 알려주세요 (예: 더 진하게)' : '오늘 마시고 싶은 커피를 한 줄로 알려주세요'}
			class="flex-1 resize-none bg-transparent px-3 py-2.5 outline-none placeholder:text-[var(--color-on-surface-variant)]/70 max-h-32"
		></textarea>
		<button
			onclick={submit}
			disabled={loading || text.trim().length === 0}
			aria-label="보내기"
			class="grid place-items-center size-11 shrink-0 rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 active:scale-95 transition disabled:opacity-40"
		>
			{#if loading}
				<Icon name="progress_activity" size={22} class="animate-spin" />
			{:else}
				<Icon name="arrow_upward" size={22} />
			{/if}
		</button>
	</div>
</div>
