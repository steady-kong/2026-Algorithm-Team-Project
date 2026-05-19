<script lang="ts">
	interface Turn {
		role: 'user' | 'assistant';
		text: string;
	}

	interface Props {
		turns: Turn[];
		busy: boolean;
		onSend: (msg: string) => void;
	}

	let { turns, busy, onSend }: Props = $props();

	let input = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const msg = input.trim();
		if (!msg || busy) return;
		onSend(msg);
		input = '';
	}

	const SUGGESTIONS = [
		'우유 못 먹어요, 다른 걸로 바꿔주세요',
		'헤이즐넛 향 빼고 다른 향으로',
		'모카포트 없어요',
		'좀 더 진하게 부탁해요',
		'덜 달게 해주세요',
		'아이스로 바꿔줘'
	];
</script>

<div class="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container p-4">
	<header class="flex items-center justify-between">
		<div>
			<h2 class="m3-headline">대화로 다듬기</h2>
			<p class="m3-label text-on-surface-variant">
				재료가 없거나 다른 방향으로 바꾸고 싶으면 자연어로 말씀해주세요.
			</p>
		</div>
	</header>

	{#if turns.length > 0}
		<ol class="flex flex-col gap-2">
			{#each turns as turn, i (i)}
				<li
					class="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
					class:self-end={turn.role === 'user'}
					class:bg-primary-container={turn.role === 'user'}
					class:text-on-primary-container={turn.role === 'user'}
					class:self-start={turn.role === 'assistant'}
					class:bg-surface-container-highest={turn.role === 'assistant'}
				>
					{turn.text}
				</li>
			{/each}
		</ol>
	{/if}

	<form onsubmit={submit} class="flex gap-2">
		<input
			type="text"
			bind:value={input}
			disabled={busy}
			maxlength="300"
			placeholder="예) 오트 우유로 바꿔주세요"
			class="flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2 text-on-surface focus:border-primary focus:outline-none"
		/>
		<button
			type="submit"
			disabled={busy || input.trim().length === 0}
			class="bg-primary text-on-primary inline-flex h-10 items-center rounded-full px-5 font-medium transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
		>
			{busy ? '…' : '보내기'}
		</button>
	</form>

	<div class="flex flex-wrap gap-1.5">
		{#each SUGGESTIONS as s (s)}
			<button
				type="button"
				disabled={busy}
				onclick={() => (input = s)}
				class="m3-label rounded-full border border-outline-variant px-3 py-1 text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-50"
			>
				{s}
			</button>
		{/each}
	</div>
</div>
