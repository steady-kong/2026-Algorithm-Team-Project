# Development Process Document — *Morgorithm*

> Planning → scheduling → execution → retrospective.
>
> **한국어 요약:** 기획·일정·실행·회고를 정리한 개발 과정 문서. 타임라인·PR·기여자 통계는
> git 이력에서 추출한 사실이며, 회의록은 커밋 클러스터를 근거로 재구성했다.

---

## 1. Team & Roles

**한국어 요약:** 팀 Morgorithm — 주 개발 2인(공성준·김승범), 자료·발표 2인(조승찬·정비호).

- **Team name:** **Morgorithm**
- **Repository:** <https://github.com/steady-kong/2026-Algorithm-Team-Project> (public)

| Member (name / student ID / email) | GitHub author(s) | Role(s) |
|---|---|---|
| 공성준 / 2022270626 / steady11317@gmail.com | `June Kong` / `SJ-Kong` / `steady11317` / `steady-kong` | **Lead developer (full-stack)** — from-scratch algorithm layer, recommendation rationale (`why`), about-page flowchart **improvements**, initial backend; also set up collaboration docs (CHANGELOG, etc.) to keep the team in sync |
| 김승범 / 2022270616 / server3342@korea.ac.kr | `server3342` / 김승범 | **Lead developer & app architect (full-stack)** — drove the app end-to-end: built the production chat app and most of the UI design, designed the function-call LLM loop, the about/flowchart page, server/API wiring, gate hardening, and deployment. **Also hosts the live deployment on his own personally-funded server.** |
| 조승찬 / 2022270620 / chosc0417@gmail.com | — (non-code) | **Lead presenter & ideation** — proposed algorithm-application ideas, owns the presentation script, rehearsal, and final talk |
| 정비호 / 2022270622 / bihobiho20@gmail.com | — (non-code) | **Presentation & QA** — contributed feature/algorithm ideas, slide production, hands-on app testing (feeding issues back to the devs), and demo screenshots |

> Roles: **공성준 & 김승범 — lead developers** (both full-stack); **조승찬 — lead presenter**;
> **정비호 — presentation materials, QA & demo.**
> *(공성준·김승범 = 주 개발, 조승찬 = 메인 발표자, 정비호 = 발표 자료·QA·데모.)*
> Git author distribution (dev commits): 공성준 = `June Kong`/`SJ-Kong`/`steady11317`,
> 김승범 = `server3342`. The same person used several author names.

---

## 2. Planning — Topic & Goals

**한국어 요약:** 알고리즘 수업 취지에 맞춰 "LLM은 생성, 알고리즘이 결정"을 핵심 컨셉으로 잡음.

- **One-paragraph statement:** A chat-based coffee recommender that uses Upstage Solar to
  generate candidate menus on demand, while from-scratch algorithms (sorting, scoring,
  diversification, greedy, blending) make the final selection — so the project demonstrates
  course algorithm concepts, not just LLM usage.
- **3 core features:**
  1. Natural-language → 3 ranked recipe cards (LLM candidates → algorithmic ranking).
  2. Conversational refine (stronger / milk swap / category narrowing) on the same pipeline.
  3. Grounded coffee Q&A + off-topic refusal.
- **Algorithm concepts in the final build:** merge sort (production ranking, stable),
  quick sort (didactic comparison), greedy (diversification + bean top-k), similarity scoring
  (L1-normalized), linear interpolation (blend), greedy feature-merge (hybrid menus in the
  fallback path). See `TECHNICAL_REPORT.md` §5.

---

## 3. Schedule & Timeline (from git history)

**한국어 요약:** 아래 타임라인은 커밋·PR 이력에서 추출한 실제 진행 경과다.

| Date | Milestone | Evidence (commit / PR) |
|------|-----------|------------------------|
| 2026-05-18 | Backend first cut + initial project docs | `백엔드 1차 구현 및 프로젝트 문서 작성` |
| 2026-05-20 | Chat-centric web app; UX overhaul; algorithm integrity (from-scratch mergeSort) | `채팅 중심 웹앱 …`, `알고리즘 무결성 …` |
| 2026-05-21 | **Function-call loop** introduced (LLM candidates → algorithm ranking); `/about` pipeline page added | `함수 호출 루프 도입 …`, `작동 방식 페이지(/about) 추가 …` |
| 2026-05-25 | **PR #5** merged — brew classification fix, taste display, comparison Q&A, identifier-leak prevention | PR #5 (`feat/brew-fix-taste-display-qa`) |
| 2026-05-28 | **PR #6** merged — recommendation gates (cold-brew + off-topic) & flowchart redesign; then off-topic gate hardened (deterministic pass) | PR #6 (`feat/chat-gates-and-flowchart`), `콜드브루 게이트 수정`, `off-topic 게이트 결정화` |
| 2026-05-28 | **PR #7** merged — algorithm-derived rationale (`why`) on cards | PR #7 (`Sungjune`) |
| 2026-06-02 | Technical report + development-process doc written; demo screenshots captured; English presentation slides built; final docs commit | `TECHNICAL_REPORT.md`, `DEVELOPMENT_PROCESS.md`, `docs/screenshots/`, `docs/Morgorithm_PresentationSlides.pdf` |
| 2026-06-02 16:00 | Final presentation (in class, English) | scheduled |

---

## 4. Execution — Per-role Progress & Workflow

**한국어 요약:** 브랜치 → PR → 리뷰 → 머지 흐름으로 협업. main 직접 푸시 대신 PR 기반.

- **Workflow:** feature branches → pull request → review → merge to `main`. Merged PRs: #5, #6, #7.
- **Quality gates:** `npm run check` (svelte-check, 0 errors) and `npm run lint` on each change;
  local runtime verification of behavior (the app was run and exercised, not just type-checked).
- **Per-role progress** (attributed from git author history):
  - **김승범 — full-stack lead & app architect (`server3342`); drove the app end-to-end:**
    - Built the chat-centric web app and **most of the UI design** + skeleton rename + recommendation/recipe UX overhaul (05-20)
    - **Function-call loop** `chatWithTools` — LLM candidate generation → algorithm ranking; **server/API wiring** (05-21)
    - **Built the `/about` pipeline page** + branch alignment, legend, README security notice (05-21)
    - Cold-brew gate fix — empty-recommendation regression guard + negative-expression recognition (05-28)
    - **Off-topic gate hardening** — deterministic keyword pass to remove classifier non-determinism (05-28)
    - Deployment — custom-domain route + rate-limit tuning, and **hosts the live app on his own personally-funded server** (05-28)
      *(앱 개발 전반을 주도했고, 라이브 배포를 개인 사비 서버로 호스팅.)*
  - **공성준 (full-stack lead) — `June Kong` / `SJ-Kong` / `steady11317`:**
    - Backend first cut + initial project docs (05-18)
    - **Algorithm integrity** — replaced `.sort()` with from-scratch `mergeSort`; dedup; lint cleanup (05-20)
    - **Collaboration docs** — set up and maintained CHANGELOG and status-sharing docs so the team could track progress while developing
    - **PR #5** — brew-method classification fix, recipe taste-axis display, comparison Q&A,
      identifier-leak prevention (05-25)
    - **PR #6** — cold-brew explicit-request gate + off-topic decline gate (LLM classifier) +
      **improved the existing `/about` flowchart** (spotted readability issues → solid connectors + arrowheads, clearer branch direction) (05-28)
    - **PR #7** — algorithm-derived rationale (`why`), mentioned-axis-only (05-28)
  - **조승찬 (lead presenter & ideation):**
    - Proposed algorithm-application ideas; wrote the presentation script, ran rehearsals, and
      delivers the final talk (in English). *(알고리즘 적용 아이디어 제안, 발표 스크립트·리허설·최종 발표.)*
  - **정비호 (presentation & QA):**
    - Contributed feature/algorithm ideas; produced the English slides, ran hands-on app testing
      (feeding issues back to the devs), and captured the demo screenshots.
      *(아이디어 제안, 영어 슬라이드 제작, 앱 실사용 테스트·이슈 피드백, 데모 스크린샷.)*

---

## 5. Issue Tracking (notable problems & resolutions)

**한국어 요약:** 개발 중 실제로 부딪힌 이슈와 해결 방식. (커밋 메시지·작업 이력 기반)

| Issue | Symptom | Resolution |
|-------|---------|------------|
| Cold brew mismatched brew method | Drip request surfaced french-press cold brew (immersion ≠ drip) | Domain gate: cold brew only on explicit request (PR #6, hardened later) |
| Off-topic requests got fake recipes | Code/math/smalltalk produced coffee recipes | Off-topic gate: deterministic keyword pass + temp-0 LLM classifier; decline with 0 recipes |
| Off-topic gate non-determinism | Same off-topic input sometimes slipped through (temp 0.3) | Deterministic domain pass-1 + lowered classifier temperature |
| Empty-recommendation regression | Gate sometimes returned 0 recipes for valid requests | Guard against empty results + negative-expression recognition (`콜드브루 게이트 수정`) |
| Fabricated rationale | "why" cited axes the user never mentioned | Restrict rationale to user-mentioned axes; hide when nothing matches (PR #7) |
| Standard-library dependence | `.sort()` used in two spots vs from-scratch promise | Replaced with from-scratch `mergeSort` (`알고리즘 무결성 …`) |
| Unused/dead code | 6 unused components; misc lint errors | Removed components; wired unused `SUMATRA_DARK` bean to `cold_brew` default; removed dead `order++` writebacks |
| Duplicated validation logic | propose/refine each held the same enum guards + `sanitizeConstraints` | Extracted shared guards into one module to keep both routes in sync |
| Flowchart hard to read | `/about` branches drawn as floating triangles | Redesigned with solid connector rails + arrowheads; continue path goes straight, target branches exit sideways |
| Lost docs on merge | CHANGELOG / new files dropped during a "keep local files" merge resolution | Recreated on a fresh branch from latest `main`; re-applied feature on top without overwrite |

---

## 6. Meeting Notes

**한국어 요약:** 대면 회의록은 git에 없어 팀이 채워야 한다. 아래에 (a) git에서 재구성한
**비동기 협업 로그**(사실)와 (b) 대면 회의록 양식을 함께 둔다.

### (a) Async collaboration log (reconstructed from PRs/commits — factual)
- **PR #5 (05-25)** — A lead dev (공성준) implemented brew-method classification, taste display,
  comparison Q&A, and identifier-leak prevention; merged after 김승범's review.
  *(주 개발(공성준)이 추출 기구 분류·맛 표시·비교 Q&A·식별자 노출 방지 작업, 김승범 리뷰 후 머지.)*
- **PR #6 (05-28)** — 공성준 added the cold-brew / off-topic gates and the flowchart redesign;
  right after merge, 김승범 fixed an empty-recommendation regression and hardened the off-topic
  gate to be deterministic (division of labor: feature introduction → hardening).
  *(본인이 게이트·플로우차트 재설계 → 김승범이 회귀 수정·게이트 견고화.)*
- **PR #7 (05-28)** — 공성준 added the recommendation rationale (`why`) and the contribution doc,
  re-applied on top of the latest `main` so it merged without conflicts.
  *(추천 근거(why) + 기여 문서를 최신 main 기준으로 재적용해 충돌 없이 머지.)*

### (b) Meeting notes — reconstructed from commit clusters; details to be expanded by the team
*(커밋 클러스터 기준 재구성 — 세부 문구는 팀이 보강)*

```
### 2026-05-18 · Meeting #1 — Kickoff (킥오프)
- Attendees (참석): 공성준, 김승범, 조승찬, 정비호
- Agenda (안건): lock the topic ("LLM generates + from-scratch algorithms decide"),
  assign roles, create the repo, apply for the Solar API
- Decisions (결정): coffee-recommendation chat app · 2 developers (공성준·김승범) /
  2 research-&-presentation (조승찬·정비호)
- Next actions (다음 액션): backend first cut (공성준), Solar key application (all)

### 2026-05-20 · Meeting #2 — Stack pivot (스택 전환)
- Agenda (안건): pivot to a chat-centric UX; confirm the from-scratch algorithm principle
  (no `.sort` / `Map` as comparator)
- Decisions (결정): single stack SvelteKit + Cloudflare Workers · from-scratch mergeSort
- Next actions (다음 액션): design the function-call loop (김승범), algorithm integrity (공성준)

### 2026-05-21 · Meeting #3 — Function-call loop & /about (함수 호출 루프 & /about)
- Agenda (안건): LLM-candidates → algorithm-ranking pipeline; a "how it works" visualization page
- Decisions (결정): adopt the `chatWithTools` terminal-tool structure · add the /about flowchart
- Next actions (다음 액션): collect gate / domain-consistency issues (조승찬·정비호)

### 2026-05-25 ~ 05-28 · Meeting #4 — Quality & domain consistency (품질·도메인 정합, PR #5~#7)
- Agenda (안건): brew classification & taste display (PR#5), cold-brew / off-topic gates &
  flowchart (PR#6), recommendation rationale `why` (PR#7)
- Decisions (결정): gates introduced (공성준) then hardened (김승범: deterministic gate, regression
  guard); rationale restricted to user-mentioned axes
- Next actions (다음 액션): write report & slides (all), demo screenshots & slides (조승찬·정비호)
```

---

## 7. Retrospective (KPT)

**한국어 요약:** Keep / Problem / Try 회고. 아래는 작업 이력에서 도출한 초안이며 팀 의견으로 보강.

**Keep**
- Held the "LLM generates, algorithms decide" concept to the end, true to the course's intent.
  *(컨셉을 끝까지 유지해 과제 취지에 부합.)*
- PR-based collaboration + type-check/lint gates kept `main` stable.
  *(PR 기반 협업 + 타입 체크/린트 게이트로 main 안정성 유지.)*
- Fixed "dishonest recommendation" moments found in user testing via the gates and rationale.
  *(사용자 테스트의 "정직하지 않은 추천" 순간들을 게이트·rationale로 교정.)*
- Cut early code made unnecessary by the function-call-loop re-architecture — hardening the core
  over widening scope. *(재설계로 불필요해진 초기 구현을 과감히 정리 — 범위보다 핵심.)*

**Problem**
- No automated tests — algorithm correctness wasn't guarded against regressions.
  *(자동화 테스트 부재 — 회귀 방지 불가.)*
- A merge conflict resolved as "keep local files" briefly dropped docs that had to be recovered.
  *(머지 충돌 해결에서 문서가 유실되었다 복구됨.)*
- Off-topic refusal was unstable on prompt alone — needed a deterministic gate.
  *(프롬프트만으론 불안정 — 결정적 게이트로 보강.)*
- LLM non-determinism (temp) classified the same input differently — mitigated with temp 0 + a
  deterministic first pass. *(LLM 비결정성 → 온도·1차 결정 패스로 완화.)*

**Try**
- Add algorithm unit tests (vitest). *(알고리즘 유닛 테스트 도입.)*
- Strengthen Q&A grounding with a real bean dataset + embedding RAG (e.g., NVIDIA NIM embeddings).
  *(실 원두 데이터 + 임베딩 RAG로 Q&A 그라운딩 강화.)*
- Tighten the merge strategy to prevent doc loss — protected branches, PR-only.
  *(머지 전략 정비 — 보호 브랜치·PR 필수화.)*

---

## 8. Deliverables Status (assignment checklist)

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Application + source (GitHub) | ✅ done (deployed) |
| 2 | Technical Report | ✅ `TECHNICAL_REPORT.md` |
| 3 | Development Process Document | ✅ this file |
| 4 | Presentation Slides (English) | ✅ `docs/Morgorithm_PresentationSlides.pdf` (원고: `PRESENTATION_NOTES.md`) |
| — | README (setup/run/demo) | ✅ setup/run + demo **screenshots** (`docs/screenshots/`) |
| — | Contribution analysis | ✅ `CONTRIBUTIONS.md` — per-commit, diff-based contribution analysis (by a teammate) *(커밋별 실제-diff 기준 기여 분석)* |

> For the per-commit contribution breakdown, see the teammate-authored [`CONTRIBUTIONS.md`](CONTRIBUTIONS.md);
> this document avoids overlap with it and focuses on planning, schedule, issues, retrospective, and meeting notes.
> *(상세 기여 분석은 `CONTRIBUTIONS.md` 참고. 이 문서는 중복을 피하고 기획·일정·이슈·회고·회의록에 집중한다.)*
