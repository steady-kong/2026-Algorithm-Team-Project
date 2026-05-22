<script lang="ts">
	import { onDestroy } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import SortDemo from '$lib/components/demos/SortDemo.svelte';
	import GraphDemo from '$lib/components/demos/GraphDemo.svelte';
	import KnapsackDemo from '$lib/components/demos/KnapsackDemo.svelte';

	interface Stage {
		icon: string;
		title: string;
		algo: string;
		complexity: string;
		desc: string;
		demo?: 'sort' | 'graph' | 'knapsack';
	}

	const stages: Stage[] = [
		{
			icon: 'edit',
			title: '한 줄 입력',
			algo: '자연어 craving',
			complexity: '—',
			desc: '“달콤하고 부드러운 따뜻한 거” 처럼 자유롭게 취향을 적어요.'
		},
		{
			icon: 'auto_awesome',
			title: 'AI 후보 생성',
			algo: 'Upstage Solar (JSON)',
			complexity: '—',
			desc: 'LLM이 목표 맛(신맛·단맛·쓴맛·바디감)을 추정하고 현실적인 커피 후보 6개를 즉석에서 생성합니다. 키가 없으면 규칙 기반 폴백이 대신 동작해요.'
		},
		{
			icon: 'tune',
			title: '점수화',
			algo: '가중 L1 유사도',
			complexity: 'O(A)',
			desc: '각 후보의 4축 프로파일과 목표 취향의 거리를 0~1 적합도로 환산합니다. 이후 모든 알고리즘이 이 점수를 키로 사용해요.'
		},
		{
			icon: 'sort',
			title: '정렬',
			algo: 'Merge Sort (안정)',
			complexity: 'O(n log n)',
			desc: '적합도 내림차순으로 안정 정렬. 동점이면 LLM이 제안한 순서를 보존합니다.',
			demo: 'sort'
		},
		{
			icon: 'diversity_2',
			title: '다양성 선택',
			algo: 'Greedy',
			complexity: 'O(n)',
			desc: '상위만 뽑으면 비슷한 메뉴가 겹쳐요. 그리디로 추출방식이 겹치지 않게 최고 점수부터 골라 최종 3장을 만듭니다.'
		},
		{
			icon: 'local_bar',
			title: '시음 세트',
			algo: '0/1 Knapsack DP',
			complexity: 'O(n·W)',
			desc: '예산(비용 합) 안에서 적합도 합이 최대가 되는 커피 조합을 동적 계획법으로 찾습니다.',
			demo: 'knapsack'
		},
		{
			icon: 'route',
			title: '취향 여정',
			algo: 'Dijkstra + 이진 힙',
			complexity: 'O((V+E) log V)',
			desc: '맛 공간을 그래프로 보고, 기준 커피에서 추천 커피까지 가장 부드럽게 이어지는 경로를 최단경로로 찾아 보여줍니다.',
			demo: 'graph'
		},
		{
			icon: 'check_circle',
			title: '결과 3장',
			algo: '카드 + 레시피',
			complexity: '—',
			desc: '추출 단계와 원두까지 담은 카드 3장. 후속 한 줄로 “더 진하게”처럼 점진적으로 좁혀갈 수 있어요.'
		}
	];

	let active = $state(0);
	let playing = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	function stop() {
		playing = false;
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}
	function play() {
		stop();
		playing = true;
		active = 0;
		timer = setInterval(() => {
			if (active >= stages.length - 1) {
				stop();
				return;
			}
			active += 1;
		}, 2200);
	}
	function select(i: number) {
		stop();
		active = i;
	}
	onDestroy(stop);

	const current = $derived(stages[active]);
</script>

<svelte:head><title>작동 방식 · Morgorithm</title></svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8">
	<header class="flex items-center justify-between mb-6">
		<a href={resolve('/')} class="inline-flex items-center gap-1 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition">
			<Icon name="arrow_back" size={18} /> 추천으로
		</a>
		<button
			onclick={playing ? stop : play}
			class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold hover:opacity-90 active:scale-95 transition"
		>
			<Icon name={playing ? 'pause' : 'play_arrow'} size={20} fill />
			{playing ? '일시정지' : '작동 재생'}
		</button>
	</header>

	<div class="text-center mb-10">
		<h1 class="text-3xl font-extrabold mb-2">LLM은 생성, <span class="text-[var(--color-primary)]">알고리즘이 일한다</span></h1>
		<p class="text-[var(--color-on-surface-variant)] max-w-xl mx-auto">
			데이터(후보)는 AI가 실시간으로 만들고, 점수화·정렬·다양성·배낭·최단경로는 직접 구현한 알고리즘이 결정합니다.
			아래에서 단계를 눌러보거나 “작동 재생”을 눌러보세요.
		</p>
	</div>

	<div class="grid md:grid-cols-[260px_1fr] gap-6 items-start">
		<!-- pipeline rail -->
		<ol class="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2">
			{#each stages as stage, i (stage.title)}
				<li class="shrink-0">
					<button
						onclick={() => select(i)}
						class="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-300 {i ===
						active
							? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-md3)] scale-[1.02]'
							: 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'}"
					>
						<span
							class="grid place-items-center size-9 shrink-0 rounded-xl {i === active
								? 'bg-white/20'
								: 'bg-[var(--color-surface-container-high)]'}"
						>
							<Icon name={stage.icon} size={20} fill={i === active} />
						</span>
						<span class="flex flex-col">
							<span class="text-[10px] font-mono opacity-70">{i + 1} / {stages.length}</span>
							<span class="font-semibold text-sm leading-tight">{stage.title}</span>
						</span>
					</button>
				</li>
			{/each}
		</ol>

		<!-- detail panel -->
		<div class="rounded-[var(--radius-md3-lg)] bg-[var(--color-surface-container)] p-6 ring-1 ring-[var(--color-outline)]/50 min-h-[360px] shadow-[var(--shadow-md3)]">
			{#key active}
				<div in:fly={{ y: 18, duration: 420, easing: quintOut }}>
					<div class="flex items-center gap-3 mb-4">
						<span class="grid place-items-center size-12 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
							<Icon name={current.icon} size={26} fill />
						</span>
						<div>
							<h2 class="text-xl font-bold">{current.title}</h2>
							<div class="flex items-center gap-2 text-sm">
								<span class="text-[var(--color-primary)] font-semibold">{current.algo}</span>
								{#if current.complexity !== '—'}
									<span class="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">{current.complexity}</span>
								{/if}
							</div>
						</div>
					</div>
					<p class="text-[var(--color-on-surface)] leading-relaxed mb-5">{current.desc}</p>

					{#if current.demo === 'sort'}
						<SortDemo />
					{:else if current.demo === 'graph'}
						<GraphDemo />
					{:else if current.demo === 'knapsack'}
						<KnapsackDemo />
					{:else}
						<div in:scale={{ start: 0.96, duration: 300 }} class="grid place-items-center h-32 rounded-2xl bg-[var(--color-surface)] ring-1 ring-[var(--color-outline)]/40">
							<Icon name={current.icon} size={56} class="text-[var(--color-primary)]/40" />
						</div>
					{/if}
				</div>
			{/key}
		</div>
	</div>

	<!-- progress bar -->
	<div class="mt-6 h-1.5 rounded-full bg-[var(--color-outline)]/30 overflow-hidden">
		<div
			class="h-full bg-[var(--color-primary)] transition-[width] duration-500"
			style="width: {((active + 1) / stages.length) * 100}%"
		></div>
	</div>

	<p class="text-center text-xs text-[var(--color-on-surface-variant)] mt-8">
		알고리즘 구현 상세는 저장소의 <code class="px-1.5 py-0.5 rounded bg-[var(--color-surface-container-high)]">ALGORITHMS.md</code> 를 참고하세요.
	</p>
</main>
