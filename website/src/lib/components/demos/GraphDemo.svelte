<script lang="ts">
	import { onDestroy } from 'svelte';
	import Icon from '../Icon.svelte';
	import { dijkstra, type TasteGraph } from '$lib/algorithms';

	// a small hand-laid taste graph (positions for drawing)
	const nodes = [
		{ x: 40, y: 120, label: '밸런스' },
		{ x: 130, y: 50, label: '산뜻' },
		{ x: 140, y: 190, label: '고소' },
		{ x: 250, y: 60, label: '플로럴' },
		{ x: 260, y: 180, label: '묵직' },
		{ x: 360, y: 120, label: '진한 한 잔' }
	];
	const edgeList: [number, number, number][] = [
		[0, 1, 2],
		[0, 2, 2],
		[1, 3, 2],
		[2, 4, 3],
		[3, 5, 3],
		[4, 5, 2],
		[1, 2, 3]
	];

	const graph: TasteGraph = nodes.map(() => []);
	for (const [a, b, w] of edgeList) {
		graph[a].push({ to: b, weight: w });
		graph[b].push({ to: a, weight: w });
	}
	const { path } = dijkstra(graph, 0, 5);

	let step = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	function run() {
		if (timer) clearInterval(timer);
		step = 0;
		timer = setInterval(() => {
			if (step >= path.length) {
				if (timer) clearInterval(timer);
				return;
			}
			step += 1;
		}, 650);
	}
	onDestroy(() => timer && clearInterval(timer));
	run();

	function inPath(i: number) {
		return path.slice(0, step).includes(i);
	}
	function edgeActive(a: number, b: number) {
		const visible = path.slice(0, step);
		for (let k = 0; k < visible.length - 1; k++) {
			if ((visible[k] === a && visible[k + 1] === b) || (visible[k] === b && visible[k + 1] === a))
				return true;
		}
		return false;
	}
</script>

<div class="rounded-2xl bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-outline)]/40">
	<svg viewBox="0 0 400 240" class="w-full h-44">
		{#each edgeList as [a, b] (a + '-' + b)}
			<line
				x1={nodes[a].x}
				y1={nodes[a].y}
				x2={nodes[b].x}
				y2={nodes[b].y}
				stroke={edgeActive(a, b) ? 'var(--color-primary)' : 'var(--color-outline)'}
				stroke-width={edgeActive(a, b) ? 4 : 1.5}
				class="transition-all duration-300"
			/>
		{/each}
		{#each nodes as node, i (node.label)}
			<g class="transition-all duration-300">
				<circle
					cx={node.x}
					cy={node.y}
					r={inPath(i) ? 16 : 12}
					fill={inPath(i) ? 'var(--color-primary)' : 'var(--color-surface-container-high)'}
					stroke="var(--color-outline)"
					stroke-width="1.5"
				/>
				<text
					x={node.x}
					y={node.y + 30}
					text-anchor="middle"
					font-size="11"
					font-weight="600"
					fill="var(--color-on-surface-variant)">{node.label}</text
				>
			</g>
		{/each}
	</svg>
	<div class="flex justify-center mt-1">
		<button
			onclick={run}
			class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] hover:opacity-90 transition"
		>
			<Icon name="replay" size={16} /> 최단 경로 다시 추적
		</button>
	</div>
</div>
