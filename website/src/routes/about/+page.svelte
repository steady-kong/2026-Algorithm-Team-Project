<script lang="ts">
	import { onDestroy } from 'svelte';

	type Kind =
		| 'input'
		| 'process'
		| 'decision'
		| 'llm'
		| 'tool'
		| 'algorithm'
		| 'fallback'
		| 'output';

	interface NodeDef {
		label: string;
		sub?: string;
		kind: Kind;
		icon: string;
		file?: string;
		what: string;
		why?: string;
	}

	// 노드 레지스트리 — 다이어그램의 모든 단계는 여기서 한 번만 정의되고, 블록 레이아웃은 id 로 참조한다.
	const NODES: Record<string, NodeDef> = {
		// ── propose ──────────────────────────────────────────────
		p_input: {
			label: '사용자 한 줄',
			sub: '"달콤하고 부드러운 따뜻한 거"',
			kind: 'input',
			icon: '✏️',
			file: 'routes/+page.svelte',
			what: '폼·옵션 없이 자연어 한 줄을 받는다. 채팅 한 줄이 추천의 유일한 입력.'
		},
		p_guard: {
			label: '요청 검증',
			sub: 'same-origin · rate limit · sanitize',
			kind: 'process',
			icon: '🛡️',
			file: 'server/security.ts · validate.ts',
			what: '동일 출처 확인, 레이트리밋, 메시지·취향·제약을 sanitize.',
			why: '사용자 입력은 데이터로만 취급해 프롬프트 인젝션을 차단한다.'
		},
		p_trivial: {
			label: '무의미한 입력인가?',
			sub: 'isTrivialGreeting',
			kind: 'decision',
			icon: '◆',
			file: 'routes/api/chat/propose',
			what: '단순 인사·자판 난타("ㅁㄴㅇㄹ")는 LLM 호출 없이 곧바로 되묻는다.',
			why: '의미 없는 입력에 추천을 억지로 만들지 않고 지연·비용을 아낀다 (fix.md N3).'
		},
		p_askagain: {
			label: '되묻기 응답',
			kind: 'output',
			icon: '💬',
			what: 'LLM 없이 "어떤 걸 원하세요?" 로 한 번 더 구체화를 유도한다.'
		},
		p_offtopic: {
			label: '커피·음료 요청인가?',
			sub: 'isCoffeeRelevant → LLM(temp 0)',
			kind: 'decision',
			icon: '◆',
			file: 'routes/api/chat/propose · util/intent.ts',
			what: '도메인 키워드가 있으면 LLM 없이 바로 통과. 키워드가 없을 때만 LLM 이진 분류(temperature 0)로 off-topic 여부를 판정한다.',
			why: '커피·음료와 무관한 요청에 아무 레시피나 만들지 않는다. 키워드 1차로 정상 요청은 빠르게 통과시키고, 분류기는 temperature 0 으로 같은 입력에 항상 같은 판정을 내려 일관되게 거른다.'
		},
		p_decline: {
			label: '정중한 거절',
			sub: '추천 상태 무변경',
			kind: 'output',
			icon: '🚫',
			what: '"커피·음료 메뉴 추천만 도와드릴 수 있어요" 안내만 응답하고 레시피는 만들지 않는다.'
		},
		p_key: {
			label: 'UPSTAGE API 호출에 성공했는가?',
			kind: 'decision',
			icon: '◆',
			file: 'server/upstage.ts',
			what: 'API 키가 없거나 호출이 실패하면 전부 결정적 규칙 폴백으로 동작한다.',
			why: '키 없이도 사이트 전체가 돌아가도록 — 알고리즘 수업 취지에 맞춰 LLM 의존을 낮춘다.'
		},
		p_toolloop: {
			label: '함수 호출 루프',
			sub: 'chatWithTools · maxSteps 5 · 22s',
			kind: 'llm',
			icon: '✦',
			file: 'server/upstage.ts',
			what: 'LLM 은 도구를 "어떤 인자로 부를지" 만 정한다. 종결 도구가 나오거나 maxSteps/시간 예산을 소진할 때까지 tool_choice=auto 로 반복.',
			why: '정적 메뉴 카탈로그 주입 없이 매 요청 LLM 이 후보를 실시간 생성하고, 선택은 알고리즘이 한다.'
		},
		t_present_rec: {
			label: 'present_recommendations',
			sub: '종결 도구',
			kind: 'tool',
			icon: '🍽️',
			file: 'server/tools.ts',
			what: '후보 메뉴 5~6개(enum 특징 + 예상 5축 + 원두 힌트)를 제출. 최종 3장 선택·정렬·다양화는 서버 알고리즘 몫.'
		},
		t_present_ans: {
			label: 'present_answer',
			sub: '종결 도구',
			kind: 'tool',
			icon: '💡',
			file: 'server/tools.ts',
			what: '커피 지식 질문에 카드 없이 텍스트만 제출. 모르는 사실(연도·수치·이름)은 만들지 않도록 가드.'
		},
		t_blend: {
			label: 'blend_candidates',
			sub: '계산 도구',
			kind: 'tool',
			icon: '🔀',
			file: 'algorithms/blend.ts',
			what: '두 5축 취향을 비율로 선형 보간해 "둘을 섞은 느낌" 을 결정적으로 계산하고 LLM 에 되먹인다.'
		},
		t_lookup: {
			label: 'lookup_knowledge',
			sub: '계산 도구',
			kind: 'tool',
			icon: '🔎',
			file: 'data/coffee-knowledge.ts',
			what: '답하기 전 검증된 자료를 조회해 근거를 확보. found=false 면 수치·연도를 지어내지 않는다.'
		},
		p_terminal: {
			label: '어떤 종결 도구를 호출했는가?',
			kind: 'decision',
			icon: '◆',
			what: 'present_answer → 지식 답변, present_recommendations → 알고리즘 랭킹. 종결 없이 끝나거나 후보 0개면 폴백으로 강하.'
		},
		p_outask: {
			label: '지식 답변',
			sub: '추천 상태 무변경',
			kind: 'output',
			icon: '💡',
			what: '질문에 텍스트로만 답하고 기존 추천 카드는 그대로 둔다.'
		},
		a_score: {
			label: '5축 유사도 점수',
			sub: 'profileMatchScore',
			kind: 'algorithm',
			icon: '📊',
			file: 'algorithms/score.ts',
			what: '각 축 절대 차이를 max 4 로 정규화한 평균(0~1). 우유·추출 기구 의도는 가중 감점.'
		},
		a_sort: {
			label: 'Merge Sort',
			sub: '안정 정렬',
			kind: 'algorithm',
			icon: '🔢',
			file: 'algorithms/sorting.ts',
			what: '적합도 내림차순. 동률은 생성 순서를 보존(안정). 표준 sort 미사용 — from-scratch.'
		},
		a_div: {
			label: 'Diversify',
			sub: '그리디 재배치',
			kind: 'algorithm',
			icon: '🎯',
			file: 'algorithms/diversify.ts',
			what: '정렬 결과에서 같은 카테고리가 연달아 오지 않도록 그리디하게 재배치한다.'
		},
		a_top3: {
			label: '상위 3장 + 결합',
			sub: 'combineEntries',
			kind: 'algorithm',
			icon: '🃏',
			file: 'routes/api/chat/propose',
			what: '상위 3개를 골라 카테고리 비주얼·레시피 스텝으로 완성한다.'
		},
		p_intent: {
			label: 'intent 보정',
			sub: 'looksLikeQuestion / hasExplicitQuestion',
			kind: 'process',
			icon: '🔁',
			file: 'routes/api/chat/propose',
			what: 'LLM 의 ask↔recommend 오분류를 의문 표지 유무로 되돌린다.',
			why: '"바닐라 라떼 따뜻한 거" 를 질문으로 오인해 정의 설명으로 새던 회귀를 차단 (fix.md #1).'
		},
		p_outrec: {
			label: '추천 3장 카드',
			sub: '+ 원두 힌트 · 후속 질문 칩',
			kind: 'output',
			icon: '✅',
			file: 'components/ProposalCards.svelte',
			what: '카드 클릭 시 인라인 레시피. 이야깃거리 후속 칩으로 추천→이야기→다음 추천 흐름을 유도.'
		},
		p_fb_single: {
			label: 'single-shot JSON',
			sub: 'runLLM · chatJson',
			kind: 'fallback',
			icon: '🛟',
			file: 'server/upstage.ts',
			what: '함수 호출 루프가 비거나 실패하면 단발 JSON 프롬프트로 한 번 더 시도. 실패하면 다시 규칙 폴백으로.'
		},
		p_fb_rule: {
			label: '규칙 기반 폴백',
			sub: 'scoreLibrary + combineEntries',
			kind: 'fallback',
			icon: '🛟',
			file: 'routes/api/chat/propose',
			what: '키 없음/전 단계 실패 시 키워드 매칭 + 라이브러리 점수화로 결정적 추천. LLM 호출 0회.'
		},

		// ── refine ───────────────────────────────────────────────
		r_input: {
			label: '후속 한 줄',
			sub: '"더 진하게" · "오트로" · "다른 거"',
			kind: 'input',
			icon: '✏️',
			what: '직전 추천 위에서 이어지는 자연어 수정 요청.'
		},
		r_guard: {
			label: '요청 검증',
			sub: 'context + brew_method 필수',
			kind: 'process',
			icon: '🛡️',
			file: 'routes/api/chat/refine',
			what: '이전 대화 컨텍스트·선택 메뉴·추출 기구가 있어야 패치를 만들 수 있다.'
		},
		r_toolpatch: {
			label: 'present_patch 루프',
			sub: 'chatWithTools',
			kind: 'llm',
			icon: '✦',
			file: 'server/tools.ts',
			what: '후속 요청을 패치로 제출: intent(swap·remove·adjust·explore·ask) + constraints + profile_delta.'
		},
		r_single: {
			label: 'single-shot JSON',
			kind: 'fallback',
			icon: '🛟',
			file: 'server/upstage.ts',
			what: '루프 실패 시 단발 JSON 패치로 시도.'
		},
		r_rule: {
			label: '규칙 (정규식)',
			sub: 'ruleBasedPatch',
			kind: 'fallback',
			icon: '🛟',
			file: 'routes/api/chat/refine',
			what: '키 없음/실패 시 정규식으로 "더 진하게→bitterness +1" 같은 delta 를 추출한다.'
		},
		r_intent: {
			label: 'intent 가 ask 인가?',
			kind: 'decision',
			icon: '◆',
			what: '지식 질문이면 답변만, 그 외엔 현재 추천에 패치를 적용한다.'
		},
		r_ask: {
			label: '지식 답변 (ask)',
			kind: 'output',
			icon: '💡',
			what: 'lookup_knowledge 로 근거를 조회한 뒤 텍스트만 응답. 추천 카드는 그대로.'
		},
		r_apply: {
			label: '패치 적용',
			sub: 'profile_delta ±2 clamp',
			kind: 'process',
			icon: '🩹',
			file: 'routes/api/chat/refine',
			what: 'constraints 병합 + 취향 5축에 delta(±2 clamp) 적용.'
		},
		r_modalt: {
			label: 'mod 1~2장 + alt 1장',
			kind: 'algorithm',
			icon: '🎯',
			file: 'routes/api/chat/refine',
			what: '선택 카드를 수정(mod)하고 다른 카테고리 대안(alt) 한 장을 추가. base 스텝은 보존.'
		},
		r_out: {
			label: '갱신된 카드',
			kind: 'output',
			icon: '✅',
			what: '수정·대안이 반영된 추천으로 화면을 갱신한다.'
		}
	};

	type Outcome = { label: string; tone: 'happy' | 'alt' | 'fail'; target?: string; note?: string };
	type Block =
		| { kind: 'node'; id: string }
		| { kind: 'branch'; id: string; outcomes: Outcome[] }
		| { kind: 'chain'; title: string; ids: string[]; seps?: string[] }
		| { kind: 'group'; title: string; ids: string[] };

	type Mode = 'propose' | 'refine';

	const PROPOSE: Block[] = [
		{ kind: 'node', id: 'p_input' },
		{ kind: 'node', id: 'p_guard' },
		{
			kind: 'branch',
			id: 'p_trivial',
			outcomes: [
				{ label: '예 (무의미)', tone: 'alt', target: 'p_askagain' },
				{ label: '아니오', tone: 'happy' }
			]
		},
		{
			kind: 'branch',
			id: 'p_offtopic',
			outcomes: [
				{ label: '무관 (off-topic)', tone: 'alt', target: 'p_decline' },
				{ label: '커피·음료', tone: 'happy' }
			]
		},
		{
			kind: 'branch',
			id: 'p_key',
			outcomes: [
				{ label: '호출 성공', tone: 'happy' },
				{ label: 'API 호출 실패', tone: 'fail', target: 'p_fb_rule' }
			]
		},
		{ kind: 'node', id: 'p_toolloop' },
		{ kind: 'group', title: '도구 레지스트리 (tools.ts)', ids: ['t_present_rec', 't_present_ans', 't_blend', 't_lookup'] },
		{
			kind: 'branch',
			id: 'p_terminal',
			outcomes: [
				{ label: 'present_answer', tone: 'alt', target: 'p_outask' },
				{ label: 'present_recommendations', tone: 'happy' },
				{ label: '없음 / 후보 0', tone: 'fail', target: 'p_fb_single' }
			]
		},
		{ kind: 'chain', title: '알고리즘 랭킹 — LLM 후보 위에서 결정적 선택', ids: ['a_score', 'a_sort', 'a_div', 'a_top3'] },
		{ kind: 'node', id: 'p_intent' },
		{ kind: 'node', id: 'p_outrec' }
	];

	const REFINE: Block[] = [
		{ kind: 'node', id: 'r_input' },
		{ kind: 'node', id: 'r_guard' },
		{
			kind: 'chain',
			title: '패치 생성 — 3단 단계적 강하',
			ids: ['r_toolpatch', 'r_single', 'r_rule'],
			seps: ['실패 시', '실패 시']
		},
		{
			kind: 'branch',
			id: 'r_intent',
			outcomes: [
				{ label: 'ask', tone: 'alt', target: 'r_ask' },
				{ label: '그 외', tone: 'happy' }
			]
		},
		{ kind: 'node', id: 'r_apply' },
		{ kind: 'node', id: 'r_modalt' },
		{ kind: 'node', id: 'r_out' }
	];

	const HAPPY: Record<Mode, string[]> = {
		propose: [
			'p_input',
			'p_guard',
			'p_trivial',
			'p_offtopic',
			'p_key',
			'p_toolloop',
			't_present_rec',
			'p_terminal',
			'a_score',
			'a_sort',
			'a_div',
			'a_top3',
			'p_intent',
			'p_outrec'
		],
		refine: ['r_input', 'r_guard', 'r_toolpatch', 'r_intent', 'r_apply', 'r_modalt', 'r_out']
	};

	const KIND_STYLE: Record<Kind, string> = {
		input: 'bg-primary-container text-on-primary-container',
		process: 'bg-surface-container-high text-on-surface border border-outline-variant',
		decision: 'bg-tertiary-container text-on-tertiary-container',
		llm: 'bg-secondary-container text-on-secondary-container',
		tool: 'bg-surface text-on-surface border border-dashed border-outline',
		algorithm: 'bg-surface-container text-on-surface border-l-4 border-primary',
		fallback: 'bg-error-container text-on-error-container',
		output: 'bg-primary text-on-primary'
	};
	const KIND_LABEL: Record<Kind, string> = {
		input: '입력',
		process: '처리',
		decision: '분기',
		llm: 'LLM',
		tool: '도구',
		algorithm: '알고리즘',
		fallback: '폴백',
		output: '출력'
	};
	const TONE_STYLE = {
		happy: 'bg-primary text-on-primary',
		alt: 'bg-tertiary text-on-tertiary',
		fail: 'bg-m3-error text-on-error'
	} as const;
	const LEGEND_KINDS: Kind[] = ['input', 'process', 'decision', 'llm', 'tool', 'algorithm', 'fallback', 'output'];

	let mode = $state<Mode>('propose');
	let selectedId = $state<string | null>(null);
	let playing = $state(false);
	let stepIndex = $state(-1);
	let timer: ReturnType<typeof setInterval> | undefined;

	const blocks = $derived(mode === 'propose' ? PROPOSE : REFINE);
	const happy = $derived(HAPPY[mode]);
	const activeId = $derived(selectedId ?? (stepIndex >= 0 ? happy[stepIndex] : null));
	const detail = $derived(activeId ? NODES[activeId] : null);

	const nodeEls = new Map<string, HTMLElement>();
	function register(node: HTMLElement, id: string) {
		nodeEls.set(id, node);
		return { destroy: () => nodeEls.delete(id) };
	}
	function scrollTo(id: string) {
		requestAnimationFrame(() => nodeEls.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
	}

	function clearTimer() {
		if (timer) clearInterval(timer);
		timer = undefined;
	}
	function selectNode(id: string) {
		pause();
		selectedId = id;
		scrollTo(id);
	}
	function play() {
		selectedId = null;
		if (stepIndex < 0 || stepIndex >= happy.length - 1) stepIndex = 0;
		playing = true;
		scrollTo(happy[stepIndex]);
		clearTimer();
		timer = setInterval(() => {
			if (stepIndex >= happy.length - 1) {
				pause();
				return;
			}
			stepIndex += 1;
			scrollTo(happy[stepIndex]);
		}, 1700);
	}
	function pause() {
		playing = false;
		clearTimer();
	}
	function step(delta: number) {
		pause();
		selectedId = null;
		const next = Math.min(Math.max(stepIndex + delta, 0), happy.length - 1);
		stepIndex = next;
		scrollTo(happy[stepIndex]);
	}
	function reset() {
		pause();
		stepIndex = -1;
		selectedId = null;
	}
	function setMode(m: Mode) {
		if (m === mode) return;
		reset();
		mode = m;
	}

	onDestroy(clearTimer);
</script>

<svelte:head><title>작동 방식 — Morgorithm</title></svelte:head>

<div class="flex flex-col gap-5">
	<header class="flex flex-col gap-2">
		<a href="/" class="m3-label w-fit text-on-surface-variant hover:text-primary">← 추천으로 돌아가기</a>
		<h1 class="m3-headline">작동 방식</h1>
		<p class="m3-body text-on-surface-variant">
			한 줄 입력이 추천 3장이 되기까지. <strong class="text-on-surface">LLM 은 후보를 생성</strong>하고,
			<strong class="text-on-surface">직접 구현한 알고리즘이 점수화·정렬·다양화로 최종 선택</strong>한다.
			노드를 눌러 단계 설명을 보거나, <strong class="text-on-surface">시연 재생</strong>으로 흐름을 따라가 보세요.
		</p>
	</header>

	<!-- 모드 탭 + 재생 컨트롤 -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div role="tablist" class="inline-flex rounded-full bg-surface-container-high p-1">
			{#each [['propose', '추천 (propose)'], ['refine', '다듬기 (refine)']] as [m, label] (m)}
				<button
					role="tab"
					aria-selected={mode === m}
					class="m3-label rounded-full px-4 py-1.5 transition-colors {mode === m
						? 'bg-primary text-on-primary'
						: 'text-on-surface-variant hover:text-on-surface'}"
					onclick={() => setMode(m as Mode)}
				>
					{label}
				</button>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<button
				class="m3-label inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-on-primary shadow-[var(--m3-shadow)] transition-transform active:scale-95"
				onclick={() => (playing ? pause() : play())}
			>
				{playing ? '⏸ 일시정지' : '▶ 시연 재생'}
			</button>
			<button
				class="m3-label rounded-full border border-outline-variant px-3 py-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
				onclick={() => step(-1)}
				disabled={stepIndex <= 0}
				aria-label="이전 단계">◀</button
			>
			<button
				class="m3-label rounded-full border border-outline-variant px-3 py-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
				onclick={() => step(1)}
				disabled={stepIndex >= happy.length - 1}
				aria-label="다음 단계">▶</button
			>
			{#if stepIndex >= 0}
				<span class="m3-label tabular-nums text-on-surface-variant">{stepIndex + 1} / {happy.length}</span>
				<button class="m3-label text-on-surface-variant hover:text-primary" onclick={reset}>초기화</button>
			{/if}
		</div>
	</div>

	<div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
		<!-- 상세 패널 — 모바일 상단 sticky, 데스크톱 우측 sticky -->
		<aside
			class="order-1 self-start md:order-2 sticky top-2 z-20 max-h-[42vh] overflow-auto rounded-2xl border border-outline-variant bg-surface-container p-4 md:top-4 md:max-h-none"
		>
			{#if detail}
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span class="text-lg" aria-hidden="true">{detail.icon}</span>
							<span class="m3-label rounded-full bg-surface-container-highest px-2 py-0.5 text-on-surface-variant"
								>{KIND_LABEL[detail.kind]}</span
							>
						</div>
						<button
							class="m3-label shrink-0 rounded-full px-2 py-0.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
							onclick={() => {
								pause();
								stepIndex = -1;
								selectedId = null;
							}}>← 범례로 돌아가기</button
						>
					</div>
					<h2 class="m3-title break-keep">{detail.label}</h2>
					{#if detail.sub}<p class="m3-label text-on-surface-variant">{detail.sub}</p>{/if}
					<p class="m3-body text-on-surface">{detail.what}</p>
					{#if detail.why}
						<p class="m3-body rounded-lg bg-surface-container-high px-3 py-2 text-on-surface-variant">
							<strong class="text-on-surface">왜:</strong>
							{detail.why}
						</p>
					{/if}
					{#if detail.file}
						<code class="m3-label w-fit rounded bg-surface-container-highest px-2 py-1 font-mono text-on-surface-variant"
							>{detail.file}</code
						>
					{/if}
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					<h2 class="m3-title">범례</h2>
					<p class="m3-body text-on-surface-variant">노드를 누르면 여기에 설명이 나옵니다.</p>
					<ul class="flex flex-col gap-1.5">
						{#each LEGEND_KINDS as k (k)}
							<li class="flex items-center gap-2">
								<span class="inline-block h-3.5 w-3.5 rounded {KIND_STYLE[k]}"></span>
								<span class="m3-label text-on-surface-variant">{KIND_LABEL[k]}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</aside>

		<!-- 플로우차트 -->
		<div class="order-2 min-w-0 md:order-1">
			{#snippet connector(label?: string)}
				<div class="flex flex-col items-center py-1">
					<div class="h-2.5 w-px bg-outline-variant" aria-hidden="true"></div>
					{#if label}
						<span class="m3-label my-0.5 rounded-md bg-surface-container px-1.5 py-0.5 text-on-surface-variant">{label}</span>
						<div class="h-2.5 w-px bg-outline-variant" aria-hidden="true"></div>
					{/if}
					<div class="h-0 w-0 border-x-4 border-t-[7px] border-x-transparent border-t-outline-variant" aria-hidden="true"></div>
				</div>
			{/snippet}

			{#snippet nodeCard(id: string, compact = false)}
				{@const n = NODES[id]}
				{@const active = activeId === id}
				{@const code = n.kind === 'tool'}
				<button
					use:register={id}
					onclick={() => selectNode(id)}
					aria-pressed={active}
					class="flex h-full w-full items-start gap-2.5 rounded-xl text-left transition-all {compact
						? 'px-3 py-2.5'
						: 'px-3.5 py-3'} {KIND_STYLE[n.kind]} {active
						? '-translate-y-0.5 shadow-[var(--m3-shadow-lg)] ring-2 ring-primary'
						: 'hover:-translate-y-0.5 hover:shadow-[var(--m3-shadow)]'}"
				>
					<span
						class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-container-highest text-[0.95rem]"
						aria-hidden="true">{n.icon}</span
					>
					<span class="min-w-0 flex-1">
						<span
							class="m3-label block font-semibold leading-snug [overflow-wrap:anywhere] {code
								? 'font-mono text-[0.8rem]'
								: ''}">{n.label}</span
						>
						{#if n.sub}<span class="m3-label mt-0.5 block leading-snug opacity-70 [overflow-wrap:anywhere]">{n.sub}</span
							>{/if}
					</span>
				</button>
			{/snippet}

			{#snippet tonePill(label: string, tone: Outcome['tone'])}
				<span
					class="m3-label max-w-full rounded-lg px-2 py-0.5 text-center leading-tight [overflow-wrap:anywhere] {TONE_STYLE[
						tone
					]}">{label}</span
				>
			{/snippet}

			{#snippet targetCol(o: Outcome)}
				<div class="flex flex-col items-center">
					<div class="h-2 w-px bg-outline-variant" aria-hidden="true"></div>
					{@render tonePill(o.label, o.tone)}
					<div class="mt-1 h-2 w-px bg-outline-variant" aria-hidden="true"></div>
					<div class="h-0 w-0 border-x-4 border-t-[7px] border-x-transparent border-t-outline-variant" aria-hidden="true"></div>
					<div class="mt-1.5 w-full">
						{#if o.target}{@render nodeCard(o.target, true)}{/if}
						{#if o.note}<p class="m3-label mt-1 text-center text-on-surface-variant">{o.note}</p>{/if}
					</div>
				</div>
			{/snippet}

			<div class="mx-auto flex w-full max-w-xl flex-col">
				{#each blocks as block, bi (bi)}
					{#if bi > 0}{@render connector()}{/if}

					{#if block.kind === 'node'}
						<div class="w-full">{@render nodeCard(block.id)}</div>
					{:else if block.kind === 'branch'}
						{@const cont = block.outcomes.find((o) => !o.target)}
						{@const targets = block.outcomes.filter((o) => o.target)}
						{@const leftT = targets.length > 1 ? targets[0] : undefined}
						{@const rightT = targets.length > 1 ? targets[1] : targets[0]}
						<div class="w-full">{@render nodeCard(block.id)}</div>
						<!-- 중앙 스템 → 수평 분기선. 계속(타깃 없음)은 중앙 레일로 직진해 다음 블록으로 이어지고, 타깃 분기는 옆으로 빠져 종료한다. -->
						<div class="flex justify-center" aria-hidden="true"><div class="h-3 w-px bg-outline-variant"></div></div>
						<div aria-hidden="true" class="border-t border-outline-variant" style="margin-left:{leftT ? '16.667' : '50'}%;width:{leftT ? '66.666' : '33.333'}%;height:0"></div>
						<div class="grid grid-cols-3 items-stretch gap-x-2">
							{#if leftT}{@render targetCol(leftT)}{:else}<div></div>{/if}
							<div class="flex flex-col items-center">
								{#if cont}
									<div class="h-2 w-px bg-outline-variant" aria-hidden="true"></div>
									{@render tonePill(cont.label, cont.tone)}
									<div class="mt-1 w-px flex-1 bg-outline-variant" style="min-height:1.5rem" aria-hidden="true"></div>
								{/if}
							</div>
							{#if rightT}{@render targetCol(rightT)}{:else}<div></div>{/if}
						</div>
					{:else if block.kind === 'chain'}
						<div class="rounded-2xl border border-dashed border-outline-variant bg-surface-container/40 p-4">
							<p class="m3-label mb-3 text-on-surface-variant">{block.title}</p>
							<div class="flex flex-col">
								{#each block.ids as id, i (id)}
									{@render nodeCard(id, true)}
									{#if i < block.ids.length - 1}
										{@render connector(block.seps?.[i])}
									{/if}
								{/each}
							</div>
						</div>
					{:else if block.kind === 'group'}
						<div class="rounded-2xl border border-dashed border-outline-variant bg-surface-container/40 p-4">
							<p class="m3-label mb-3 text-on-surface-variant">{block.title}</p>
							<div class="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
								{#each block.ids as id (id)}
									{@render nodeCard(id, true)}
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>
