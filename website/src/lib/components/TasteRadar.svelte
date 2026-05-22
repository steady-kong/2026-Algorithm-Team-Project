<script lang="ts">
	import { TASTE_AXES, AXIS_LABEL, type TasteProfile } from '$lib/types/taste';

	interface Props {
		profile: TasteProfile;
		size?: number;
		/** optional faint reference polygon (e.g. the target) */
		reference?: TasteProfile;
	}
	const { profile, size = 200, reference }: Props = $props();

	const cx = $derived(size / 2);
	const cy = $derived(size / 2);
	const r = $derived(size / 2 - 28);

	function point(value: number, i: number, max = 5) {
		const angle = (Math.PI * 2 * i) / TASTE_AXES.length - Math.PI / 2;
		const radius = (value / max) * r;
		return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
	}
	function polygon(p: TasteProfile) {
		return TASTE_AXES.map((axis, i) => point(p[axis], i).join(',')).join(' ');
	}
	function labelPos(i: number) {
		const angle = (Math.PI * 2 * i) / TASTE_AXES.length - Math.PI / 2;
		return [cx + (r + 16) * Math.cos(angle), cy + (r + 16) * Math.sin(angle)];
	}
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" role="img" aria-label="맛 프로파일 차트">
	<!-- grid rings -->
	{#each [1, 2, 3, 4, 5] as ring (ring)}
		<polygon
			points={TASTE_AXES.map((_, i) => point(ring, i).join(',')).join(' ')}
			fill="none"
			stroke="var(--color-outline)"
			stroke-width="1"
			opacity={ring === 5 ? 0.8 : 0.35}
		/>
	{/each}
	<!-- spokes + labels -->
	{#each TASTE_AXES as axis, i (axis)}
		{@const [lx, ly] = labelPos(i)}
		<line x1={cx} y1={cy} x2={point(5, i)[0]} y2={point(5, i)[1]} stroke="var(--color-outline)" stroke-width="1" opacity="0.4" />
		<text
			x={lx}
			y={ly}
			text-anchor="middle"
			dominant-baseline="middle"
			font-size="12"
			font-weight="600"
			fill="var(--color-on-surface-variant)">{AXIS_LABEL[axis]}</text
		>
	{/each}
	{#if reference}
		<polygon
			points={polygon(reference)}
			fill="var(--color-secondary)"
			opacity="0.12"
			stroke="var(--color-secondary)"
			stroke-width="1.5"
			stroke-dasharray="4 3"
		/>
	{/if}
	<!-- main profile (animates via CSS transition on points) -->
	<polygon
		class="profile-shape"
		points={polygon(profile)}
		fill="var(--color-primary)"
		fill-opacity="0.22"
		stroke="var(--color-primary)"
		stroke-width="2.5"
		stroke-linejoin="round"
	/>
	{#each TASTE_AXES as axis, i (axis)}
		{@const [px, py] = point(profile[axis], i)}
		<circle class="profile-dot" cx={px} cy={py} r="3.5" fill="var(--color-primary)" />
	{/each}
</svg>

<style>
	.profile-shape,
	.profile-dot {
		transition:
			all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}
</style>
