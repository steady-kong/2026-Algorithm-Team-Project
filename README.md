# Morgorithm

> 자연어 한 줄로 취향을 말하면 LLM 이 메뉴를 큐레이션하고, **직접 구현한 알고리즘**(표준 정렬·맵 미사용)이 점수화·정렬·다양성·하이브리드 조합을 담당하는 SvelteKit 웹앱.
>
> 배포: <https://morgorithm.dotoroi.xyz/>
> 2026 Algorithm Team Project

상세 구현 결정과 변경 이력은 [`plan.md`](plan.md), 고객 체험 기반 UX 수정 이력은 [`fix.md`](fix.md), 커피 도메인 레퍼런스(원두·로스팅·추출·메뉴·5축 매핑)는 [`info.md`](info.md).

---

## 개요

알고리즘 수업 프로젝트의 본 취지를 살리기 위해 **LLM 의존도를 최소화**한다.

- **LLM (Upstage Solar)** — 자연어 이해 + 메뉴 큐레이션 + 도메인 Q&A.
- **직접 구현 알고리즘** — 점수화 · 정렬 · 다양성 · 그리디 · 캐싱.
- **커피 도메인 Q&A** — "에티오피아 원두 어때?", "콜드브루 어떻게 만들어?" 같은 지식 질문도 [`info.md`](info.md) 다이제스트를 근거로 답변(`intent="ask"`).
- **시연** — 추천 레시피로 강의실에서 실제 추출. 사업화 컨셉은 "원두 구매 시 커미션 수익".

초기에는 단계형 폼 UI + Python FastAPI 백엔드로 출발했으나, 채팅 중심 UX 로 전환하면서 알고리즘을 TypeScript 로 포팅하고 Cloudflare Workers 단일 스택으로 통합했다. Python 원형은 [`skeleton/`](skeleton/) 에 보존 — 시연·리포트 목적.

---

## 채팅 흐름

```
사용자 한 줄 (예: "달콤하고 부드러운 따뜻한 거")
   ▼
POST /api/chat/propose  (intent=recommend)
   라이브러리 30+ 메뉴 + 태그 + 커피 지식 다이제스트 주입
   LLM: 그대로 1개 + 하이브리드 1~2개 (inspired_by id)
   서버: 화이트리스트 검증 → 카테고리 결합 → Recipe 완성
   ▼
3장 카드 (카테고리 비주얼 + ✨ 영감 배지 + 🌱 추천 원두 산지·로스트)
클릭 시 인라인 레시피 펼침
   ▼ 후속 한 줄
POST /api/chat/refine
   "더 진하게"     → mod 1~2장 + 다른 카테고리 alt 1장
   "오트 우유로"   → milk_type=oat, base steps 보존
   "다른 거 또"    → 보여준 항목 회피, 신선한 후보 우선
   "라떼만 보여줘" → category_only 명시적 좁힘
   ▼ 또는 지식 질문 (어디서든)
POST /api/chat/{propose|refine}  (intent=ask)
   "에티오피아 원두 어때?" · "라이트 vs 다크 차이?" · "달고나 누가 만들었어?"
   → info.md 다이제스트 근거 텍스트 응답, 추천 상태 무변경
```

각 추천 카드 뒤로는 *이야깃거리 후속 질문 칩*(예: "아인슈페너 유래는?", "How about Ethiopian beans?")이 함께 노출돼 *추천 → 이야기 → 다음 추천* 흐름을 유도한다. 세션은 `localStorage` 에 24h TTL 로 보관 — 새로고침해도 마지막 대화로 복귀.

---

## 직접 구현 알고리즘

`Array.prototype.sort` / `Map` / `Set`(정렬 비교) 비의존, 모두 from-scratch.

| 알고리즘 | 위치 | 역할 |
|----------|------|------|
| Merge Sort (안정 정렬) | [`sorting.ts`](website/src/lib/algorithms/sorting.ts) | 적합도 내림차순, 동률은 생성 순서 보존 |
| Quick Sort (Lomuto) | [`sorting.ts`](website/src/lib/algorithms/sorting.ts) | 보조 정렬 |
| Greedy (원두) | [`greedy.ts`](website/src/lib/algorithms/greedy.ts) | 적합도 임계치 이상 원두 가격 오름차순 top-k |
| Greedy (메뉴 하이브리드) | [`combineEntries`](website/src/routes/api/chat/propose/+server.ts) | 두 라이브러리 항목 특징을 합쳐 하이브리드 spec |
| Diversify (그리디 재배치) | [`diversify.ts`](website/src/lib/algorithms/diversify.ts) | 정렬 결과에서 동일 카테고리 연속 회피 |
| 5축 유사도 점수 | [`score.ts`](website/src/lib/algorithms/score.ts) | 절대 차이를 max 4 로 정규화한 평균(0~1) |

Python 원형(`merge_sort`, `quick_sort`, open-addressing `HashTable`, CLRS `RedBlackTree`)은 [`skeleton/app/algorithms/`](skeleton/app/algorithms/) 에 보존.

도메인 모델 — `TasteProfile`(5축, 1~5 이산), `MenuCategory`(11종), `BrewMethod`(5종), `RecipeEntry` 라이브러리(30+) — 는 [`website/src/lib/types/`](website/src/lib/types/) · [`recipe-library.ts`](website/src/lib/data/recipe-library.ts).

---

## API

| 경로 | 입력 → 출력 |
|------|------------|
| `POST` [`/api/chat/propose`](website/src/routes/api/chat/propose/+server.ts) | 메시지 + 컨텍스트 → `intent=recommend` 면 3장 제안 / `intent=ask` 면 지식 답변 |
| `POST` [`/api/chat/refine`](website/src/routes/api/chat/refine/+server.ts) | 후속 한 줄 → 패치(constraints / profile_delta) + mod/alt, 또는 ask 텍스트 |
| `POST` [`/api/beans`](website/src/routes/api/beans/+server.ts) | 취향 → 그리디 top-k 원두 |
| `POST` [`/api/preference`](website/src/routes/api/preference/+server.ts) | 자유 텍스트 → 5축 |
| `POST` [`/api/recipe`](website/src/routes/api/recipe/+server.ts) | 5축 + 기구 → 정렬된 레시피 N개 |
| `POST` [`/api/beginner`](website/src/routes/api/beginner/+server.ts) | 자연어 → 5축 + 카테고리 풀 + 후보 8개 |

모든 LLM 응답은 enum 화이트리스트 + 1~5 clamp + `inspired_by` 라이브러리 존재 검증을 거친다. ask 응답은 [`coffee-knowledge.ts`](website/src/lib/data/coffee-knowledge.ts) 다이제스트(`info.md` 압축본)에 그라운딩되며, 다이제스트 밖 사실은 만들지 못하도록 시스템 프롬프트에서 가드된다.

LLM 키 없거나 호출 실패 시 **규칙 기반 폴백**(키워드 매칭 + `scoreLibrary` + 정규식 패치)으로 자동 전환 — 어느 경로로 생성됐든 점수화·정렬·다양성은 동일하게 적용된다.

---

## 실행

```bash
cd website
npm install
npm run dev                                # 로컬 (포트 5173)

# Upstage 키는 선택 — 없어도 규칙 폴백으로 전체 동작
echo 'UPSTAGE_API_KEY="..."' > .dev.vars
```

배포는 Cloudflare Workers (`npm run deploy`). 상세 명령은 아래 *개발자 가이드* 참고.

---

## 로드맵

- [ ] 다나와 크롤러 → 실 원두 데이터 (현재 mock 18종)
- [ ] Hashing 캐시 (`(profile, constraints)` 정규화 키로 refine 캐싱)
- [ ] 본격 다국어 (현재 ko/en) — 일/중/스페인어 등 실수요 발생 시 paraglide-js 도입
- [ ] 시연 준비 (강의실 전기 + 실제 추출)
- [ ] 미사용 컴포넌트 정리

---

<details>
<summary><strong>개발자 가이드 — 기술 스택 · 디렉터리 · 검증 · 배포</strong></summary>

### 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | SvelteKit 2 + Svelte 5 (runes) |
| 언어 | TypeScript (strict) |
| 스타일 | Tailwind CSS v4 (`@theme` 토큰 매핑) |
| 호스팅 | Cloudflare Workers (`adapter-cloudflare`) |
| LLM | Upstage Solar `solar-pro2` (OpenAI 호환 JSON 모드) |
| 폰트 | Pretendard Variable (jsDelivr CDN) |
| 디자인 토큰 | Material Design 3 (라이트/다크 자동 + 수동 토글) |

번들 축소를 위해 Zod 등 외부 검증 라이브러리는 쓰지 않고 [`validate.ts`](website/src/lib/server/validate.ts) 의 타입 가드 헬퍼로 대체한다.

### 디렉터리 구조

```
2026-Algorithm-Team-Project/
├── README.md · plan.md · fix.md · info.md
│
├── website/                          # 운영 스택 — SvelteKit + Cloudflare
│   ├── wrangler.jsonc
│   ├── scripts/verify-upstage.mjs    # Upstage 호출 단위 검증
│   └── src/
│       ├── routes/
│       │   ├── +page.svelte          # 채팅 단일 페이지
│       │   └── api/chat/{propose,refine} · api/{beans,preference,recipe,beginner}
│       └── lib/
│           ├── algorithms/   sorting · greedy · diversify · score
│           ├── data/         recipe-library · beans_mock · coffee-knowledge · story-hooks · bean-hints
│           ├── server/       upstage · validate · recipe-generator · preference-rules
│           ├── types/        taste · brew · recipe · bean · menu · constraints · proposal
│           ├── components/   Composer · ChatBubble · ProposalCards · RecipeDetail
│           └── stores/       client-id · theme · chat-session (localStorage)
│
└── skeleton/                         # 알고리즘 원형 (Python) — 운영 미사용
    └── app/{algorithms,schemas,services,api/routes,data}/
```

### 검증

```bash
cd website
npm run check                              # svelte-check (Node 20+ 필요)
npm run lint
node scripts/verify-upstage.mjs            # Upstage 호출 케이스 검증
```

> Node 18 이 PATH 우선인 환경에서는 `svelte-check` 가 undici `File is not defined` 로 죽는다. `PATH=/usr/local/bin:$PATH npm run check` 같이 Node 20+ 를 강제하라.

### 배포 (Cloudflare Workers)

```bash
cd website
npx wrangler secret put UPSTAGE_API_KEY    # 1회 (운영)
npm run deploy                             # 빌드 + wrangler deploy
```

### Python 원형 실행 (선택)

```bash
cd skeleton
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest
```

</details>
