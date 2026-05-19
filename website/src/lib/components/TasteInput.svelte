<script lang="ts">
	interface Props {
		text: string;
		busy: boolean;
		onSubmit: (text: string) => void;
		onBack: () => void;
	}

	let { text = $bindable(), busy, onSubmit, onBack }: Props = $props();

	const EXAMPLES = [
		'바디감 묵직하고 산미는 약하게',
		'산뜻하고 과일향 가득한 라이트 로스팅',
		'단맛 강하고 쓴맛은 적은 데일리 커피',
		'진한 다크 로스팅, 풀바디 에스프레소 느낌'
	];

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		onSubmit(trimmed);
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<label class="m3-label text-on-surface-variant" for="taste-text">
		원하는 커피의 맛을 자유롭게 적어주세요.
	</label>
	<textarea
		id="taste-text"
		rows="4"
		bind:value={text}
		maxlength="500"
		disabled={busy}
		placeholder="예) 바디감이 있고 산미가 부드러운, 단맛이 살짝 도는 커피"
		class="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
	></textarea>

	<div class="flex flex-wrap gap-2">
		{#each EXAMPLES as ex (ex)}
			<button
				type="button"
				onclick={() => (text = ex)}
				disabled={busy}
				class="rounded-full border border-outline-variant px-3 py-1 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
			>
				{ex}
			</button>
		{/each}
	</div>

	<div class="flex items-center justify-between gap-2">
		<button
			type="button"
			onclick={onBack}
			disabled={busy}
			class="text-on-surface-variant hover:text-on-surface m3-label inline-flex items-center gap-1"
		>
			← 추출 기구 다시 선택
		</button>
		<button
			type="submit"
			disabled={busy || text.trim().length === 0}
			class="bg-primary text-on-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-7 font-medium transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
		>
			{busy ? '추천 생성 중…' : '레시피 추천받기'}
		</button>
	</div>
</form>
