# Morgorithm — website (SvelteKit + Cloudflare Workers)

이 디렉터리는 *Morgorithm* 의 운영 스택(프론트엔드 + 서버 라우트)이다. 프로젝트 개요·아키텍처·
알고리즘 설명·데모는 저장소 루트의 [`../README.md`](../README.md) 를 참고할 것.

## 실행

```sh
npm install
npm run dev          # 로컬 (포트 5173)
npm run dev -- --open

# Upstage Solar 키는 선택 — 없어도 규칙 폴백으로 전체 동작
echo 'UPSTAGE_API_KEY="..."' > .dev.vars
```

## 검증 · 빌드 · 배포

```sh
npm run check        # svelte-check (타입)
npm run lint         # eslint
npm run build        # 프로덕션 빌드
npm run deploy       # Cloudflare Workers 배포 (wrangler)
```

> 배포 환경에서는 `.dev.vars` 가 아니라 Worker secret 으로 키를 주입한다:
> `npx wrangler secret put UPSTAGE_API_KEY`

## 구조 (요약)

```
src/
├── routes/
│   ├── +page.svelte                 # 채팅 페이지
│   ├── about/+page.svelte           # 작동 방식 (인터랙티브 플로우차트)
│   └── api/chat/{propose,refine}    # 추천·후속 다듬기 (함수 호출 루프)
└── lib/
    ├── algorithms/   sorting · score · diversify · greedy · blend  (from-scratch)
    ├── server/       upstage · tools · validate · recipe-generator · security · ratelimit
    ├── types/        taste · brew · recipe · menu · constraints · proposal
    └── components/   Composer · ChatBubble · ProposalCards · RecipeDetail
```

자세한 알고리즘·API 표는 루트 [`../README.md`](../README.md) 와 [`../TECHNICAL_REPORT.md`](../TECHNICAL_REPORT.md) 참고.
