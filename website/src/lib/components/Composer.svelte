<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		busy: boolean;
		onSend: (text: string) => void;
		quickReplies?: readonly string[];
		placeholder?: string;
	}

	let { busy, onSend, quickReplies = [], placeholder = '메시지를 입력하세요…' }: Props =
		$props();

	const MAX_LEN = 300;
	const WARN_AT = 280;

	let value = $state('');
	let inputEl: HTMLInputElement | null = $state(null);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const text = value.trim();
		if (!text || busy) return;
		onSend(text);
		value = '';
	}

	// 칩 클릭은 즉시 전송이 아니라 입력창에 채워넣어 사용자가 다듬을 수 있도록 한다.
	// 같은 칩을 다시 누르면 (이미 그 텍스트가 들어 있으면) 그제서야 전송한다.
	async function applyChip(text: string) {
		if (busy) return;
		if (value.trim() === text) {
			onSend(text);
			value = '';
			return;
		}
		value = text.slice(0, MAX_LEN);
		await tick();
		inputEl?.focus();
		// 커서를 끝으로 이동.
		const end = value.length;
		inputEl?.setSelectionRange(end, end);
	}
</script>

<div class="flex flex-col gap-2">
	<form onsubmit={submit} class="flex gap-2">
		<input
			type="text"
			bind:value
			bind:this={inputEl}
			disabled={busy}
			maxlength={MAX_LEN}
			{placeholder}
			class="flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none"
			aria-label="메시지"
		/>
		<button
			type="submit"
			disabled={busy || value.trim().length === 0}
			aria-label="보내기"
			title="보내기"
			class="bg-primary text-on-primary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-medium transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
		>
			{#if busy}
				<span aria-hidden="true">…</span>
			{:else}
				<!-- Material Symbols: send (filled). https://fonts.google.com/icons -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 -960 960 960"
					width="20"
					height="20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Z" />
				</svg>
			{/if}
			<span class="sr-only">보내기</span>
		</button>
	</form>

	{#if value.length >= WARN_AT}
		<div class="m3-label flex justify-end text-on-surface-variant" aria-live="polite">
			<span class:text-error={value.length >= MAX_LEN}>
				{value.length} / {MAX_LEN}
			</span>
		</div>
	{/if}

	{#if quickReplies.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each quickReplies as chip (chip)}
				{@const isPrimed = value.trim() === chip}
				<button
					type="button"
					disabled={busy}
					onclick={() => applyChip(chip)}
					title={isPrimed ? '한 번 더 누르면 전송' : '클릭해서 입력창에 채우기'}
					class="m3-label rounded-full border px-3 py-1 transition-colors disabled:opacity-50"
					class:border-primary={isPrimed}
					class:text-primary={isPrimed}
					class:bg-primary-container={isPrimed}
					class:border-outline-variant={!isPrimed}
					class:text-on-surface-variant={!isPrimed}
					class:hover:bg-surface-container-high={!isPrimed}
				>
					{chip}
				</button>
			{/each}
		</div>
	{/if}
</div>
