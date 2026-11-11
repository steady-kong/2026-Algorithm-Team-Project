# Technical Report — *Hanjan Pick (한잔픽)*

> A chat-based coffee recommender where an LLM generates candidates and
> **algorithms implemented from scratch make the final decision.**
>
> **한국어 요약:** 사용자가 자연어 한 줄로 취향을 말하면, LLM(Upstage Solar)이 함수 호출로
> 후보 메뉴를 실시간 생성하고, 직접 구현한 알고리즘(정렬·점수화·다양성·그리디·블렌딩)이
> 최종 3장을 고른다. "LLM은 생성, 알고리즘이 결정"이 설계 핵심이다.

- **Live demo:** <https://hanjan-pick.steady11317.workers.dev/>
- **Repository:** GitHub (public)
- **Course:** 2026 Algorithm Team Project

---

## 1. Overview

**한국어 요약:** 알고리즘 수업 취지를 살려, 데이터는 LLM이 실시간 생성하되 점수화·정렬·선택은
직접 구현한 알고리즘이 맡는다.

Hanjan Pick is a single-page chat application for coffee menu recommendation. A user
describes a craving in one line ("something sweet and creamy, warm"); the system replies
with three recipe cards, each carrying an **algorithmic rationale** and a recommended bean.
The defining principle is a strict division of labor:

- **The LLM is the idea generator** — it imagines 5–6 candidate menus on demand, each with a
  predicted taste profile. It never sorts, never selects, never speaks to the user directly.
- **Our from-scratch algorithms are the decision-maker** — scoring, sorting, diversification,
  and selection all run in a small `algorithms/` layer we wrote (no `Array.prototype.sort`,
  no `Map`/`Set` used as comparators).

This split is what makes the project an *algorithms* deliverable rather than an LLM wrapper.

---

## 2. System Architecture

**한국어 요약:** 프론트엔드·서버·LLM 프록시가 하나의 SvelteKit 코드베이스에 있고 Cloudflare
Workers 단일 스택으로 배포된다. 모든 LLM 출력은 스키마 검증과 알고리즘을 거친다.

### 2.1 Frontend + Backend separation

The project satisfies the **Frontend + Server** requirement with SvelteKit's two halves in one
TypeScript codebase:

- **Frontend** — Svelte 5 (runes) components rendering the chat UI, proposal cards, and the
  `/about` pipeline visualization.
- **Backend** — SvelteKit **server routes** (`src/routes/api/**/+server.ts`) running on
  Cloudflare Workers. These hold the LLM proxy, validation, rate limiting, and the algorithm
  pipeline. The Upstage API key lives only as a Worker secret, never in the client bundle.

### 2.2 Request pipeline

```
Chat UI
  │  POST /api/chat/propose            (first recommendation)
  ▼
[ same-origin + rate-limit + sanitize ]
  │
  ├─ off-topic gate    (deterministic keyword pass → LLM temp-0 binary classifier)
  │      └─ not coffee-related? → decline, 0 recipes
  │
  ├─ Solar function-call loop (chatWithTools)
  │      └─ model calls present_recommendations → 5–6 candidate menus (+ predicted 5-axis)
  │
  ├─ ALGORITHMS:  score (5-axis fit) → mergeSort (stable) → diversify (greedy)
  │      → top 3 → cold-brew gate → attachCategory → full Recipe
  │
  └─ rationale (why) attached to each card  ← algorithm-derived, not LLM text

  │  POST /api/chat/refine             (follow-up: "stronger", "oat milk", "show only lattes")
  ▼
[ same gates ] → present_patch terminal tool → apply delta → re-run scoring pipeline
```

### 2.3 Graceful degradation (3 tiers)

The chat path never shows a blank screen:

1. **Function-call loop** (`chatWithTools`) — primary path.
2. **Single-shot JSON** (`chatJson`) — if the loop fails or times out.
3. **Rule-based fallback** — keyword matching + `scoreLibrary` + regex patches. Runs **with no
   API key at all**. The same scoring/sorting/diversification still applies on top.

---

## 3. Technology Stack

**한국어 요약:** SvelteKit 2 + Svelte 5, TypeScript strict, Tailwind v4, Cloudflare Workers,
Upstage Solar `solar-pro3`. 외부 검증 라이브러리(zod 등)를 쓰지 않고 타입 가드로 대체.

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | SvelteKit 2 + Svelte 5 (runes) | Single-stack FE + server routes |
| Language | TypeScript (strict) | `svelte-check` 0 errors gate |
| Styling | Tailwind CSS v4 (`@theme` tokens) | Material Design 3 light/dark |
| Hosting | Cloudflare Workers (`adapter-cloudflare`) | Edge serverless |
| LLM | **Upstage Solar `solar-pro3`** | OpenAI-compatible function calling + JSON mode |
| Validation | hand-written type guards (`validate.ts`) | No Zod — keeps bundle small |

---

## 4. How the LLM Is Used

**한국어 요약:** Solar 함수 호출(tool use)로 구조화 출력을 강제한다. 종결 도구를 호출해야 턴이
끝나며, 모든 enum·수치는 화이트리스트 + 1~5 clamp 검증을 거친다. 우리 블렌딩 알고리즘도
LLM에 도구로 노출한다.

### 4.1 Function calling, not free text

The chat routes use Upstage Solar's OpenAI-compatible **function calling**. The model must fill
a **terminal tool** call to end a turn, which gives us schema-locked outputs instead of parsing
prose.

**Terminal tools:**
- `present_recommendations` — commit 5–6 candidate menus, each with enum features
  (category / brew / milk / aroma / syrups / temperature) **and a predicted 5-axis taste vector**.
- `present_answer` — knowledge Q&A answer (knowledge questions don't force a recipe).
- `present_patch` — refine deltas: intent + constraints + profile delta.

**Helper (non-terminal) tools:**
- `lookup_knowledge` — fetch grounded facts before answering (hallucination guard).
- `blend_candidates` — **exposes our own blend algorithm to the model**: when the LLM wants a
  hybrid of two menus, it calls this instead of guessing the resulting taste profile.

### 4.2 Output safety

Every LLM-produced value passes through whitelist checks, 1–5 clamping, and delta ±2 clamping
in the server before reaching an algorithm. Knowledge answers are constrained by a system-prompt
grounding guard plus the static `coffee-knowledge` digest, because Solar has no chat-grounding API.

---

## 5. Algorithm Concepts Applied  ★ core grading section

**한국어 요약:** 표준 라이브러리 정렬·맵을 쓰지 않고 모두 직접 구현했다. 각 알고리즘이 어디서
어떻게 쓰이는지 아래 표에 정리한다. (정렬·분할정복·그리디·선형보간·유사도)

> **Constraint we held:** no `Array.prototype.sort`, no `Map`/`Set` as a comparison structure —
> every comparison-based decision goes through code in `src/lib/algorithms/`.

| Concept | Implementation | Where & how it's used |
|---------|----------------|------------------------|
| **Merge Sort** — stable, O(n log n), divide & conquer | `algorithms/sorting.ts` | Rank LLM candidates by 5-axis fit (descending). **Stability** preserves generation order on ties. Also bean price ascending. |
| **Quick Sort** — Lomuto partition, avg O(n log n) | `algorithms/sorting.ts` | Implemented for course comparison (stable vs unstable, average vs worst case). |
| **Greedy — diversification** | `algorithms/diversify.ts` | After sorting, re-arrange so the same menu category isn't shown back-to-back (O(K·N)). |
| **Greedy — bean top-k** | `algorithms/greedy.ts` | Filter beans by fit threshold → sort by price ascending → take *k* (`/api/beans`). |
| **Similarity scoring** — L1 distance normalized | `algorithms/score.ts` | `profileMatchScore` / `cupMatchScore`: per-axis `1 − |Δ|/4` averaged → fit ∈ [0,1]. Drives ranking **and** the user-facing rationale. |
| **Linear interpolation (blend)** | `algorithms/blend.ts` | 5-axis profile interpolation of two parents at a ratio — deterministic "what would the mix taste like". Exposed as an LLM tool. |
| **Greedy feature merge (hybrid)** | `propose/+server.ts` `combineEntries` | Fallback path: merge two library entries' enum features into one hybrid spec. |

### 5.1 Why merge sort in production

Ranking ties are common (many candidates share a fit score). A **stable** sort keeps the LLM's
generation order on ties, which is more predictable for the user than an unstable reshuffle —
hence merge sort on the hot path, quick sort retained for didactic comparison.

### 5.2 Algorithm-derived rationale (`why`)

Each card shows a `🎯` line such as *"단맛이 취향에 잘 맞아요 · 적합도 100%"*. This is produced by
the **same `cupMatchScore`** used for ranking, but restricted to **only the taste axes the user
actually mentioned** in their message (regex-detected). If no mentioned axis matches well, the
line is hidden — the system does not fabricate a justification. This makes the algorithm's
decision visible and honest to the user.

---

## 6. Key Implementation Details

**한국어 요약:** off-topic 게이트, 콜드브루 도메인 게이트, 추천 근거(why) 등 도메인
정합성과 정직성을 높인 구현들.

- **Off-topic gate** — a deterministic domain-keyword pass first; if no signal, a temp-0 LLM
  binary classifier. Non-coffee requests (code, math, smalltalk) are declined with no recipe,
  instead of the model hallucinating a coffee answer.
- **Cold-brew domain gate** — cold brew is immersion-style and fundamentally different from drip
  or espresso extraction, so it only appears on **explicit** request (mention / `category_only` /
  refining a chosen cold brew). A drip-coffee user never gets a french-press answer.
- **Session persistence** — chat state kept in `localStorage` with a 24h TTL; refresh restores
  the last conversation.
- **Security** — same-origin guard on JSON POSTs, rate limiting (Cloudflare binding in prod,
  in-memory sliding window in dev), security headers.

---

## 7. Future Improvements

**한국어 요약:** 현재 앱은 계획 범위를 모두 구현했고, 더 발전시킬 방향 두 가지를 둔다.

The app delivers the full planned scope. Two directions would extend it further:

- **Real bean dataset** — the curated bean library could be replaced with a crawler-sourced,
  live-priced dataset, letting the greedy bean recommender rank real products.
- **Embedding-based Q&A grounding** — layering an embedding retrieval (e.g., NVIDIA NIM
  embeddings) over the knowledge digest would broaden factual coverage for domain questions.

---

## 8. Repository Map

```
website/src/lib/algorithms/   sorting · score · diversify · greedy · blend   ← from-scratch
website/src/lib/server/       upstage (chatJson · chatWithTools) · tools · validate
                              · recipe-generator · security · ratelimit
website/src/routes/api/chat/  propose · refine                              ← pipeline
website/src/routes/about/     pipeline visualization
README.md · CHANGELOG.md · TECHNICAL_REPORT.md · DEVELOPMENT_PROCESS.md
```

See `README.md` for setup/run instructions and `DEVELOPMENT_PROCESS.md` for the development
timeline and retrospective.
