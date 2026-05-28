# Changelog

이 프로젝트의 주요 변경 사항을 기록한다. 최신 항목이 위로 온다.

## [Unreleased]

### Fixed
- **off-topic 게이트 비결정성** — 분류기를 `temperature 0` 으로 호출하고 도메인 키워드 1차 통과(`isCoffeeRelevant`)를
  추가해, 같은 off-topic 입력이 실행마다 다르게 분류돼 가끔 추천이 새던 문제 해결(`api/chat/propose` · `server/upstage.ts`).
- **콜드브루 빈 추천 회귀** — 비요청 콜드브루를 빈 추천 폴백 *전*에 걸러, 콜드브루만 생성된 결과가 전부 제거돼
  "메뉴 못 만듦" 오류로 새던 문제 차단(폴백이 신선한 비-콜드브루 후보로 채움)(`api/chat/propose`).
- **콜드브루 부정 표현 인식** — "콜드브루 말고" 같은 배제 요청에도 콜드브루가 후보에 남던 문제를, 부정 표현을 거르는
  공용 `mentionsColdBrew`(`util/intent.ts`)로 propose·refine 양쪽에서 수정.
- **추출 방식 분류** — "커피 머신으로 내려줘" 처럼 **`에스프레소 머신` 외의 머신 표현**(`커피 머신`·`머신`·`기계`·`coffee machine`)이
  추출 의도로 감지되지 않아 콜드브루가 끼던 문제 수정. `detectBrewIntent`(`util/intent.ts`)에 해당 표현을 추가.
- **추출 기구 감점 정확도** — propose 후보 점수화 시 카테고리가 강제하는 실제 추출 기구를 반영하도록 개선.
  `cold_brew`는 카테고리상 항상 `french_press`로 굳어지므로, LLM이 후보에 적어낸 겉보기 `brew_method`가 아니라
  `effectiveBrewMethod`(신규, `server/recipe-generator.ts`) 기준으로 사용자의 기구 의도와 비교해 머신 요청에 콜드브루가
  끼지 않게 함(`api/chat/propose`).
- **지식 Q&A — 비교("차이/vs") 질문** — "콜드브루랑 아이스 아메리카노 차이?" 같은 비교 질문이 첫 매칭 한 항목만 설명하던 문제 수정.
  `findAnswer`(`data/coffee-knowledge.ts`)가 비교 표지를 감지하면 서로 다른 두 grounded 답을 합쳐 차이를 설명한다.
  (propose·refine·`lookup_knowledge` 모든 경로에 적용)
- **내부 식별자 노출 방지** — Q&A 답변에 카테고리 영문 코드(`cold_brew`·`iced_americano` 등), 라이브러리 id(`r-…`),
  영문 분류 태그(`classic`·`refreshing`·`bitter` 등)가 그대로 노출되던 문제(single-shot 폴백 경로)에 대해
  propose의 두 시스템 프롬프트(single-shot·tool-loop)에 노출 금지 가드를 추가.

### Added
- **off-topic 요청 거절 게이트** — 커피·음료와 무관한 요청(코딩·잡담·의미 없는 입력 등)에 아무 레시피나 만들지 않고
  정중히 거절한다. 도메인 키워드 1차(`isCoffeeRelevant`, `util/intent.ts`) 후 신호가 없으면 LLM 이진 분류
  (`classifyCoffeeRelevant`, `api/chat/propose`)로 판정한다.
- **레시피별 맛 특성 표시** — 추천 카드 3장 각각에 `predicted_cup`(산미·바디감·단맛·쓴맛, 각 N/5)을 표시해
  세 후보를 한눈에 비교할 수 있게 함(`components/ProposalCards.svelte`). 값은 추출 기구·카테고리·시럽에서
  결정적으로 계산되어 후보마다 다르다.

### Changed
- **콜드브루 명시 요청 게이트** — 침지식 콜드브루가 비요청 맥락의 드립·에스프레소 변주에 섞이지 않도록, 메시지에
  콜드브루를 명시했을 때만 후보·대안·변주 풀에 포함(`api/chat/{propose,refine}`).
- **`/about` 플로우차트** — 떠다니던 분기 화살표(▾)를 연결선+화살촉으로 바꿔 분기를 직관화하고, off-topic 게이트
  단계를 다이어그램에 추가(`routes/about/+page.svelte`).
- **검색창 플레이스홀더** — 추상적인 예시(`달콤하고 부드러운 따뜻한 커피`)를 기능을 더 잘 드러내는 예시
  (`핸드드립으로 산미 있는 아이스커피` — 추출 기구·맛 축·온도를 한 문장에)로 변경(`routes/+page.svelte`).
