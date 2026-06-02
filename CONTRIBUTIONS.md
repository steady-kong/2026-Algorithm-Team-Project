# 기여 분석 (Morgorithm)

> push 된 커밋을 **하나씩 실제 diff(`git show`)로 분석**해 정리한다. 커밋 제목·메시지가 아니라
> **그 커밋이 코드/트리에 실제로 만든 변화**를 기준으로 한다. 메시지와 실제 변경이 다른 경우는 따로 표시한다.
> 분석 대상: `origin/main` 의 전체 커밋 21개(일반 17 + 머지 4).

---

## 작성자(신원) 병합

| 표기된 author | 이메일 | 실제 인물 |
|---|---|---|
| `June Kong` | steady11317@gmail.com | **June Kong** |
| `SJ-Kong` | june020110@gmail.com | **June Kong** (요청에 따라 병합) |
| `steady11317` | steady11317@msi-ubuntu-laptop… | **June Kong** (같은 `steady11317` 핸들 — 노트북에서 git 설정 없이 커밋한 것으로 추정해 병합. *추론이므로 확인 바람*) |
| `server3342` | server3342@gmail.com | **server3342 / 김승범** |
| `김승범` | 74778384+server3342@users.noreply… | **server3342 / 김승범** (GitHub noreply, 머지 커밋용 — 병합) |

→ 실질 기여자는 **June Kong** 과 **server3342(김승범)** 두 명.

---

## 전체 커밋 타임라인 (각 커밋 = 한 줄)

| # | 커밋 | 날짜 | 작성자 | 한 줄 요약(실제 변경 기준) |
|---|---|---|---|---|
| 1 | `54dd968` | 05-18 | June Kong | Python FastAPI 백엔드 1차 — from-scratch 알고리즘 4종(정렬·해싱·RBT·그리디)+서비스+테스트 |
| 2 | `1b001fc` | 05-20 | server3342 | **SvelteKit+Cloudflare 채팅 웹앱 전체 신규**(현 프로덕션 앱) + backend→skeleton 리네임 |
| 3 | `cd468f1` | 05-20 | server3342 | README 알고리즘 표 정합 + favicon(머그컵 SVG) 교체 |
| 4 | `bb11877` | 05-20 | June Kong | mergeSort 교체·6컴포넌트 삭제·chat-shared 추출·린트 (※ origin/main 가지, 후속 머지에서 미반영) |
| 5 | `e441e56` | 05-20 | June Kong | from-scratch 해시캐시(hash-cache.ts) 신규·refine 캐싱 (※ 동일 가지, 미반영) |
| 6 | `2130cb4` | 05-21 | server3342 | **함수 호출 루프 아키텍처**(tools.ts·blend.ts·intent.ts, chatWithTools) — 단발→tool-loop 재설계 |
| 7 | `cc6ce2d` | 05-21 | server3342 | `/about` 인터랙티브 플로우차트 페이지 + 코드정리 + README 보안경고 |
| 8 | `6ee931f` | 05-21 | server3342 | **머지(ours): origin/main(4·5번) 끌어오되 로컬 함수-루프 트리 유지** |
| 9 | `aaceede` | 05-21 | server3342 | about 다이어그램 3×3 그리드 정렬·문구 + wrangler workers_dev=false |
| 10 | `e0c8038` | 05-21 | server3342 | about "범례로 돌아가기" 버튼 + README 트리 정합 |
| 11 | `4337149` | 05-25 | June Kong | 추출기구 분류 보정·카드 4축 표시·비교 Q&A·식별자노출 차단 + CHANGELOG 재신설 |
| 12 | `8628c2c` | 05-25 | 김승범 | 머지 PR#5 (11번 통합) |
| 13 | `e174caa` | 05-28 | June Kong | about 플로우차트: 떠다니는 삼각형 → 연결선+화살촉 |
| 14 | `8eb38cf` | 05-28 | June Kong | 추천 게이트: 콜드브루 명시-요청 + off-topic 거절(classifyCoffeeRelevant) |
| 15 | `ce5d14e` | 05-28 | server3342 | 콜드브루 게이트 회귀 수정(폴백 전 필터) + mentionsColdBrew 부정표현 인식 |
| 16 | `413b024` | 05-28 | server3342 | 배포: 커스텀 도메인 라우트 + 레이트리밋 조정 |
| 17 | `43cd563` | 05-28 | server3342 | off-topic 게이트 결정화(키워드 1차 + LLM temp 0) + about/README/CHANGELOG |
| 18 | `680d8ec` | 05-28 | 김승범 | 머지 PR#6 (13·14번 통합) |
| 19 | `fc9a54d` | 05-28 | June Kong | 추천 근거(why) 표시 — 발화 기준 적합도 한 줄(match-explain.ts) |
| 20 | `faa96d2` | 05-28 | June Kong | 문서: SUNGJUNE_CONTRIBUTIONS.md 추가(문서만) |
| 21 | `e031553` | 05-29 | 김승범 | 머지 PR#7 (19·20번 통합) |

---

## 핵심: "커밋 메시지 ≠ 실제 변경"인 지점

실제 diff를 보면 메시지가 변경 규모/성격을 다르게 표현한 곳이 있다.

- **`1b001fc`** — 메시지는 "추천/레시피 **UX 일괄 개선**"이지만, 실제로는 **새 웹앱 전체를 from-scratch로 신설**(약 8,900줄 손코드 + 생성파일). 프로젝트의 실제 무게중심이 이 커밋에 있다.
- **`6ee931f`** — "Merge origin/main" 이라는 평범한 머지처럼 보이지만, 실제 트리 diff는 **비어 있다**. June Kong의 `hash-cache.ts`·`chat-shared.ts`(4·5번)를 히스토리로만 끌어오고 **파일은 트리에 반영하지 않은** ours 전략 머지다. → 아래 "아키텍처 충돌" 참조.
- **`4337149`** — 메시지에 "CHANGELOG.md 신설"이라 적혀 있는데, CHANGELOG는 4번(`bb11877`)에서 이미 한 번 만들어졌다. 그 파일이 6ee931f ours 머지로 사라져 **여기서 다시 만든 것**(재신설)이다.
- **`bb11877`/`e441e56`** — 메시지의 검증·구현 내용은 코드와 일치하지만, 이 커밋들이 만든 **파일이 최종 코드베이스에 없다**(트리 기준으로는 미반영). 메시지만 보면 현역 기능처럼 읽히므로 주의.

---

## 아키텍처 충돌 — 무엇이 실제로 살아남았나 (정직한 정리)

05-20~21에 두 사람의 작업이 **다른 가지에서 평행하게** 진행됐고, 일부는 **같은 일을 중복**으로 했다.

- **June Kong (`bb11877`)** 과 **server3342 (`2130cb4`)** 는 **동일한 미사용 컴포넌트 6개**(BeanCard·BrewMethodPicker·ChatPanel·RecipeTable·TasteInput·ui/Button)를 **각자 따로 삭제**했다. → 결과적으로 트리에서는 **한 번의 삭제**로 반영(서버3342 함수-루프 가지를 통해).
- 둘 다 `.sort()` → **from-scratch mergeSort** 교체를 했다. 최종 코드에 살아남은 mergeSort 호출은 **server3342의 `2130cb4` 경로**로 들어온 것(ours 머지에서 그 트리가 채택됨).
- June Kong이 새로 만든 **`hash-cache.ts`(from-scratch FNV-1a 해시 + 분리연쇄 + LRU)** 와 **`chat-shared.ts`(공용 enum 가드·sanitizeConstraints)** 는 `6ee931f` ours 머지로 **최종 트리에서 제외**됐다. (실측: 두 파일 모두 `origin/main` 트리에 부재. git 히스토리에는 커밋으로 보존.)

> **실행되는 알고리즘 정직 정리** — 현재 라이브 웹앱(`website/`)의 from-scratch 알고리즘은 **정렬(mergeSort)·greedy·diversify·score·blend(TS)** 다.
> **해싱과 RBT는 라이브 앱에 없다.** Python 해싱·RBT는 `skeleton/` 에만 남아 있고(참조/리포트용), June Kong의 TS 해시캐시는 위 머지에서 빠졌다.

→ 이 절의 취지는 **공과를 가르려는 게 아니라**, 커밋이 "실제로 무엇을 코드베이스에 남겼는가"를 사실대로 적는 것이다. `bb11877`/`e441e56`은 origin/main에 올라간 실재 기여이며, 아키텍처가 함수-루프로 수렴하면서 해당 파일이 채택되지 않았을 뿐이다.

---

## June Kong 기여 (= June Kong + SJ-Kong + steady11317)

### 1. Python FastAPI 백엔드 1차 구현 — `54dd968`
프로젝트의 **알고리즘 토대를 from-scratch로 직접 구현**. 현재는 `skeleton/` 에 보존(시연·리포트용 원형), 프로덕션은 2번 커밋의 TS 웹앱이 대체.
- **알고리즘 4종(표준 라이브러리 미의존):**
  - `sorting.py` — 안정 **merge sort**(key/reverse 지원) + Lomuto **quick sort**. `sorted()` 미사용.
  - `hashing.py` — **개방주소법(선형 탐사)** 해시테이블. 용량 16 시작, 적재율 0.7에서 재해싱, tombstone 삭제. 파이썬 `dict` 미사용.
  - `rbt.py` — **CLRS 정석 레드-블랙 트리**(NIL 센티넬, 색 기반 fixup, `insert`/`search`/`range_search`/`inorder`). 추천 이력을 (나노초 타임스탬프, 시퀀스) 키로 저장 → O(log n) 범위질의.
  - `greedy.py` — 5축 취향 정규화 매치 점수 + 100g 단가 환산 + 예산/임계 필터 후 단가순 그리디 top-k.
- **서비스 계층(LLM + 규칙 폴백 이중화):** `preference_service`(키워드 근방 윈도우로 5축 강도 추론), `recipe_service`(추출변수→예상컵 선형근사 채점, 커스텀 HashTable 캐시, mergeSort 랭킹), `bean_service`, `history_store`(RBT 백엔드), `llm_client`(Upstage, 키 없으면 NotConfigured).
- **API 4종**: `preference/parse`, `recipe/generate`, `recipe/history`(RBT 범위질의), `beans/recommend`.
- **데이터·스키마·테스트**: `beans_mock.json` 원두 18종, Pydantic 스키마, **테스트 모듈 9개**(알고리즘 4 + 서비스/이력/API).

### 2. 알고리즘 무결성 + 중복 제거 — `bb11877` *(origin/main 가지; 최종 트리 미반영)*
- propose `scoreLibrary` / refine `pickAlternativeEntry`의 네이티브 `.sort()` 2곳을 **from-scratch mergeSort**로 교체(동률 안정성 유지).
- 미사용 컴포넌트 **6개 삭제**(server3342의 `2130cb4`와 중복 — 트리엔 1회 반영).
- **`chat-shared.ts` 신규** — propose/refine 중복 enum 가드 6종 + `clamp1to5` + `sanitizeConstraints`(빈 배열 거부) 단일화.
- 린트 6건 해소: `bean-hints`의 미사용 `SUMATRA_DARK`를 의도대로 `cold_brew` 디폴트에 배선(잠재 데이터 버그 동시 수정), `recipe-generator`의 `order++` dead writeback 5건 정리. CHANGELOG 최초 신설.

### 3. from-scratch 해시 캐시 — `e441e56` *(origin/main 가지; 최종 트리 미반영)*
- **`hash-cache.ts` 신규**: `fnv1a32`(FNV-1a 32비트, UTF-16 바이트 혼합으로 한글 충돌 감소) + `HashCache<V>`(**분리 연쇄 + 2의 거듭제곱 버킷 비트마스크 + tick 기반 LRU + 용량 상한 256**, `Map` 미사용 — mergeSort와 같은 from-scratch 원칙).
- refine에서 **가장 비싼 LLM 호출(runLLMPatch)만** 캐싱. 키 = `(locale, message, contextHint)`, 값은 `clonePatch`로 복제(값 의미론). 후보 생성·규칙 폴백은 미캐싱. 모듈 스코프(워커 warm isolate 동안 유지).

### 4. 추출기구 분류·맛 표시·비교 Q&A·식별자 차단 — `4337149` (PR#5, **라이브**)
- `detectBrewIntent`에 "커피 머신/머신/기계/coffee machine" 인식 추가(누락 갈래 보정).
- **`effectiveBrewMethod`** 도입 — `cold_brew`→`french_press` 등 카테고리 강제 기구를 채점에 반영해 머신 요청에 콜드브루가 끼면 감점.
- `ProposalCards`에 **카드별 예상 4축(산미·바디·단맛·쓴맛 N/5)** 표시.
- `coffee-knowledge`의 `findAnswer`가 "차이/vs" 비교 질문을 감지해 **두 grounded 답을 합쳐** 설명.
- propose 프롬프트(single-shot·tool-loop 양쪽)에 **내부 식별자(enum·라이브러리 id·태그) 노출 금지** 가드. 검색창 플레이스홀더를 기능 시연형으로 변경. CHANGELOG 재신설.

### 5. about 플로우차트 직관화 — `e174caa` (PR#6, **라이브**)
- 떠다니던 삼각형 글리프를 **실선 연결선 + 화살촉**으로 교체. 분기를 "계속(타깃 없음)=중앙 레일 직진 / 타깃 분기=옆으로 빠져 종료"로 재구성해 "폴백이 다음 단계로 이어지는 듯" 보이던 부자연스러움 해소.

### 6. 추천 게이트(콜드브루·off-topic) — `8eb38cf` (PR#6, **라이브**, 이후 server3342가 보강)
- **`classifyCoffeeRelevant`** 신규(propose 루프 전 이진 분류) — 커피·음료 무관 요청(코딩·잡담 등)이면 추천 0개로 정중히 거절. 분류 실패/키 없음은 **fail-open**.
- 콜드브루(침지식)는 메시지 언급·`category_only`·(refine)콜드브루 선택 후 조정일 때만 후보 포함. propose/refine 폴백 확장 풀에서도 비요청 콜드브루 차단.

### 7. 추천 근거(why) 표시 — `fc9a54d` (PR#7, **라이브**)
- **`match-explain.ts` 신규** — `explainCupMatch(cup, profile, message, locale)`: **사용자가 메시지에서 실제 언급한 맛 축에만** 한정(정규식 보수 감지), 잘 맞는(차이≤1) 축만 짚어 적합도% 한 줄 생성, 없으면 빈 문자열 → 카드에서 근거 줄 숨김. 한국어 조사(이/가) 받침 자동 선택.
- `Proposal.why` 필드 추가, propose/refine(일반·mod·alt)에 `why` 부착, `ProposalCards`에 🎯 근거 줄 렌더(있을 때만).

### 8. 기여 문서 — `faa96d2` (PR#7)
- `SUNGJUNE_CONTRIBUTIONS.md`(58줄) 추가. **문서만**(코드 변경 없음).

---

## server3342 / 김승범 기여

### 1. 채팅 중심 웹앱 전체 신규 — `1b001fc` (현 프로덕션 앱의 뼈대)
메시지("UX 일괄 개선")보다 훨씬 큰, **새 앱 전체 신설**(손코드 약 8,900줄; `package-lock.json`·`worker-configuration.d.ts`는 생성파일).
- **SvelteKit + Cloudflare Workers** 단일 스택, 단일 페이지 채팅 UX.
- **알고리즘 TS 포팅(from-scratch):** `sorting.ts`(안정 merge + quick), `greedy.ts`(예산·점수 필터 top-k), `diversify.ts`(같은 카테고리 연속 방지 리랭크), `score.ts`(5축 L1 유사도).
- **채팅 API:** `/api/chat/propose`(후보 생성→화이트리스트 검증→채점→레시피 부착) + `/api/chat/refine`(swap/adjust/explore/ask, mod/alt 생성, 규칙 폴백) + beans/beginner/preference/recipe 보조 4종. *이 시점은 single-shot 프롬프트 방식*(이후 6번에서 함수-루프로 재설계).
- **서버 라이브러리:** `recipe-generator`(추출변수→예상컵 선형근사, SCA 골드컵 기준 base 레시피, 카테고리 델타), `ratelimit`(**UUID v7** 클라이언트 ID + 슬라이딩 윈도우, CF 바인딩 폴백), `security`(HSTS·nosniff·X-Frame-Options·noindex, same-origin 검사 — **AI 크롤러 차단**), `upstage`, `validate`, `preference-rules`.
- **데이터/지식:** `coffee-knowledge`(산지·가공·로스팅·추출·메뉴·역사 다이제스트), `recipe-library`(템플릿 30종), `bean-hints`, `story-hooks`.
- **UI:** 단일 페이지 채팅(메시지 종류별 렌더, **localStorage 세션 24h**), 전반적인 웹사이트 디자인. `uuid.ts`(v7 생성/검증), `locale.ts`(한글/라틴 감지로 ko/en), 스토어 3종.
- **`backend/` → `skeleton/` 순수 리네임**(내용 무변경) — 수업 스켈레톤임을 명시.

### 2. README 표 정합 + favicon — `cd468f1`
README에서 호출처 없는 quickSort 행 제거·mergeSort 설명 통합, 로컬 노트(plan/fix/info) 명시. SvelteKit 기본 로고 → **Morgorithm 머그컵 SVG**(다크 배경+흰 머그컵+김 두 가닥).

### 3. 함수 호출 루프 아키텍처 — `2130cb4` (설계 전환점)
프로젝트 컨셉("LLM 생성 → 직접 구현 알고리즘 랭킹")을 코드로 실현한 **핵심 재설계**.
- `upstage.ts`에 **`chatWithTools`** 에이전트 루프(`tool_choice=auto`, 다단계, 타임아웃). 기본 모델 **solar-pro2→pro3**, 헤더 주석 오타(pro2→pro3) 수정.
- **`tools.ts` 신규** — 종결 도구 스키마 `present_recommendations`/`present_patch`/`present_answer`(+지식조회). **`blend.ts`** — 5축 선형 보간. **`intent.ts`** — `detectBrewIntent`.
- `score.ts`에 `profileMatchScore` 추가(`matchScore`가 위임). propose(+358)/refine(+268)을 tool-loop로 재배선, 단발 JSON·규칙으로 단계적 폴백. 미사용 컴포넌트 6개 삭제(June Kong `bb11877`과 중복).

### 4. `/about` 작동방식 페이지 — `cc6ce2d`
- **인터랙티브 파이프라인 플로우차트**(약 648줄): 노드 클릭 상세 + ▶ 시연 재생, 헤더 "작동 방식" 내비.
- 코드 정리: `matchScore→profileMatchScore` 위임, `ROAST_LEVELS` 상수화, propose에 카테고리 의도 감지. README 보안 경고(임시 도메인·민감정보 입력 금지) 추가.

### 5. ours 머지 — `6ee931f`
origin/main(June Kong의 hash-cache·chat-shared)을 히스토리로 끌어오되 **로컬 함수-루프 트리를 유지**. 트리 diff 없음(아키텍처 충돌을 로컬 기준으로 결정).

### 6. about 다이어그램 다듬기 — `aaceede`, `e0c8038`
- `aaceede`: 분기를 **3×3 그리드**로 재구성(행 정렬·카드 높이 통일), 결정 노드를 완결형 문장으로, Upstage 분기 문구를 "호출 성공/실패" 기준으로. wrangler `workers_dev=false`(커스텀 도메인만).
- `e0c8038`: 노드 상세에 **"← 범례로 돌아가기"** 버튼(범례 복귀 불가 문제 해결), README 트리(util·ui)를 실제와 정합.

### 7. 콜드브루 게이트 회귀 수정 — `ce5d14e`
- 비요청 콜드브루를 **폴백 결정 전에** 걸러, 콜드브루만 나온 LLM 결과가 전부 제거돼 "메뉴 못 만듦"으로 새던 회귀 차단(폴백이 채움).
- **`mentionsColdBrew()`** 신규(intent.ts) — "콜드브루 말고" 같은 **부정 표현 인식**, propose/refine 중복 검사 대체.

### 8. 배포 설정 — `413b024`
wrangler에 커스텀 도메인 `morgorithm.dotoroi.xyz` 라우트 추가, 레이트리밋 조정(LLM/PLAIN period 60→10초, PLAIN limit 30→10).

### 9. off-topic 게이트 결정화 — `43cd563`
- off-topic 게이트를 **키워드 1차(`isCoffeeRelevant`) + LLM `temperature 0` 분류**로 결정화(같은 입력에 일관 거절). `chatJson`에 temperature 옵션 추가.
- about 플로우차트에 off-topic 게이트 단계 추가, README 흐름·콜드브루 게이트 순서·카드 4축 표기 보정, CHANGELOG 반영.

### 10. PR 통합 머지 — `8628c2c`(#5), `680d8ec`(#6), `e031553`(#7)
June Kong의 기능 브랜치 3건을 `main` 으로 통합.

---

## 요약

- **server3342(김승범)** — 현 프로덕션 웹앱의 **뼈대와 아키텍처**를 구축·소유: 채팅 웹앱 전체 신설(`1b001fc`), 함수 호출 루프 재설계(`2130cb4`), `/about` 시각화, 배포·보안·레이트리밋, off-topic 게이트 결정화, 콜드브루 회귀 수정, PR 통합. **커밋·트리 반영량 최다.**
- **June Kong** — **알고리즘 토대(Python from-scratch 4종, 현 `skeleton/`)** 와, 라이브 앱의 여러 **사용자 대면 기능**: 추출기구 분류·예상 4축 표시·비교 Q&A(`4337149`), 추천 게이트 1차 설계(`8eb38cf`), 추천 근거(why) 표시(`fc9a54d`), about 플로우차트 직관화. 추가로 origin/main 가지의 무결성·해시캐시 리팩터(`bb11877`·`e441e56`)는 실재 기여이나 아키텍처가 함수-루프로 수렴되었음.

*(이 문서는 `git show` 로 각 커밋의 실제 diff를 확인해 작성했다. 라인 번호는 변동 위험이 커 파일/함수 단위로만 기술한다.)*
