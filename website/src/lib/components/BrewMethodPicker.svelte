<script lang="ts">
	import { BREW_METHODS, BREW_METHOD_LABELS, type BrewMethod } from '$lib/types/brew';

	interface Props {
		value: BrewMethod | null;
		onSelect: (m: BrewMethod) => void;
	}

	let { value, onSelect }: Props = $props();

	const ICONS: Record<BrewMethod, string> = {
		hand_drip: '☕',
		moka_pot: '🫖',
		espresso_machine: '⚙️',
		aeropress: '🧪',
		french_press: '🫙'
	};

	const DESCRIPTIONS: Record<BrewMethod, string> = {
		hand_drip: '드리퍼·종이 필터로 천천히 추출',
		moka_pot: '직화식, 진하고 묵직한 한 잔',
		espresso_machine: '고압 추출, 풀바디 에스프레소',
		aeropress: '간편하고 깔끔한 추출',
		french_press: '침지식, 풍부한 바디감'
	};
</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
	{#each BREW_METHODS as method (method)}
		{@const selected = value === method}
		<button
			type="button"
			onclick={() => onSelect(method)}
			class="group flex h-full flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all"
			class:border-primary={selected}
			class:bg-primary-container={selected}
			class:text-on-primary-container={selected}
			class:border-outline-variant={!selected}
			class:bg-surface-container={!selected}
			class:text-on-surface={!selected}
			aria-pressed={selected}
		>
			<span class="text-3xl" aria-hidden="true">{ICONS[method]}</span>
			<span class="m3-title">{BREW_METHOD_LABELS[method]}</span>
			<span class="m3-label opacity-70">{DESCRIPTIONS[method]}</span>
		</button>
	{/each}
</div>
