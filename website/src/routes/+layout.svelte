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
	<header class="border-b border-outline-variant bg-background/85 backdrop-blur">
		<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
			<!--
			  로고 클릭이 / 로 가는데 어차피 단일 페이지라 무의미했다.
			  대신 디스플레이로만 두고, 의미 있는 화면 라벨 역할.
			-->
			<div class="flex items-center gap-2 text-on-background">
				<span class="text-xl" aria-hidden="true">☕</span>
				<span class="m3-title">커피 레시피 추천</span>
			</div>
			<ThemeToggle />
		</div>
	</header>

	<main class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-4 pb-4">
		{@render children()}
	</main>
</div>
