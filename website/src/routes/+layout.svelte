<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!--
  Full-height flex column 으로 헤더/메인/푸터를 잡고, 메인은 flex-1.
  이전엔 main padding(`pb-24 pt-8`) + sticky composer 가 동시에 잡혀
  `h-[calc(100dvh-8rem)]` 계산이 모바일 키보드 노출 시 흐트러졌다.
  100svh: 모바일 브라우저 UI(주소창) 제외 — 실제 보이는 높이만 잡는다.
-->
<div class="flex min-h-svh flex-col bg-background text-on-background">
	<!-- sticky 헤더: 스크롤해도 따라오고, backdrop-blur 로 본문 위에 떠 보인다. -->
	<header
		class="sticky top-0 z-30 border-b border-outline-variant bg-background/85 shadow-[var(--m3-shadow)] backdrop-blur"
	>
		<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
			<!-- /about 이 생기며 로고 → 홈 링크가 의미를 가진다. -->
			<a
				href="/"
				class="group flex items-center gap-2 text-on-background transition-opacity duration-150 hover:opacity-80"
			>
				<!-- 호버 시 ☕ 가 살짝 기울며 커지는 마이크로 인터랙션. -->
				<span
					class="inline-block text-xl transition-transform duration-200 ease-out group-hover:-rotate-12 group-hover:scale-110"
					aria-hidden="true">☕</span
				>
				<span class="m3-title">커피 레시피 추천</span>
			</a>
			<div class="flex items-center gap-1">
				<a
					href="/about"
					class="m3-label rounded-full px-3 py-1.5 text-on-surface-variant transition-[background-color,color,transform] duration-150 hover:-translate-y-0.5 hover:bg-surface-container-high hover:text-on-surface active:translate-y-0"
					>작동 방식</a
				>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<main class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-4 pb-4">
		{@render children()}
	</main>
</div>
