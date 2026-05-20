# CHANGELOG

> 팀원별 변경 이력. 시간(KST, ISO 8601) · 작성자 · 변경 내용 · 이유 순으로 기록한다.
> 새 항목은 **위쪽**에 추가한다 (최신 → 과거 순). 같은 날 여러 건은 시간순으로 쌓는다.
>
> 포맷:
> ```
> ## YYYY-MM-DD
> ### HH:MM · 작성자
> - **영역**: 변경 한 줄 요약
>   - 상세: 무엇을 왜 어떻게 바꿨는지
>   - 파일: `path/to/file.ts` (line 또는 함수명)
> ```

---

## 2026-05-20

### 14:00 · 김세중 (Claude 보조)
- **P1 · 린트 정리**: `npm run lint` 에러 6개 해소 (0 errors)
  - `src/lib/data/bean-hints.ts`: 미사용 `SUMATRA_DARK` → `cold_brew` 디폴트로 연결
    - 발견: `SUMATRA_DARK`의 rationale("풀바디·낮은 산미 — 진한 침지식·아이스 추출에서 묵직한 베이스")이 명백히 콜드브루용으로 작성됐는데, `cold_brew`는 `BRAZIL_MEDIUM_DARK`(이미 4개 카테고리 공유)로 매핑돼 있던 잠재 버그. 단순 삭제 대신 의도대로 배선해 린트 에러 + 데이터 버그 동시 해결.
  - `src/lib/server/recipe-generator.ts`: `no-useless-assignment` 5건 — 분기 종료(`return`/함수 끝) 직전 push 의 `order++` → `order` (증가값이 이후 사용되지 않아 writeback 무의미). 출력되는 step order 값은 동일.
  - 잔존: `worker-configuration.d.ts` 경고 2건은 wrangler cf-typegen 생성 파일이라 미수정(재생성 시 덮어쓰기됨).
- **검증**: `npm run check` 통과 (321 파일 / 0 ERRORS) + `npm run lint` 0 errors

### 11:00 · 김세중 (Claude 보조)
- **P0-1 · 알고리즘 무결성**: `.sort()` 두 곳을 직접 구현한 `mergeSort` 로 교체
  - 이유: README의 "Array.prototype.sort 비의존, 모두 from-scratch" 약속 위반이 두 곳 존재. 알고리즘 수업 채점 시 문제 소지.
  - 파일:
    - `website/src/routes/api/chat/refine/+server.ts` `pickAlternativeEntry()` — `.sort((a,b)=>b.w-a.w)` → `mergeSort(scored, { key, reverse: true })`
    - `website/src/routes/api/chat/propose/+server.ts` `scoreLibrary()` — `.sort((a,b)=>b.weight-a.weight)` → `mergeSort(filtered, { key, reverse: true })`
- **P0-2 · 번들 정리**: 미사용 컴포넌트 6개 삭제
  - 이유: `grep`으로 import 전무 확인. README 로드맵의 "미사용 컴포넌트 정리" 항목 처리.
  - 파일: `BeanCard.svelte`, `BrewMethodPicker.svelte`, `ChatPanel.svelte`, `RecipeTable.svelte`, `TasteInput.svelte`, `ui/Button.svelte`
- **P1 · 공통 로직 추출**: propose/refine 중복 코드를 `src/lib/server/chat-shared.ts` 로 분리
  - 이유: 두 라우트가 동일한 enum 화이트리스트·`sanitizeConstraints`를 따로 보유하던 것을 통합. 한쪽만 수정해서 검증 규칙이 어긋나는 사고 방지 + 유지보수 부담 해소.
  - 신규 파일: `website/src/lib/server/chat-shared.ts` — `isCategory/isBrew/isMilk/isAroma/isSyrup/isTemperature`, `clamp1to5`, `sanitizeConstraints` 공유
  - propose: 타입 가드 6개 + `sanitizeConstraints` 30줄 제거, 미사용 enum 상수 import 정리
  - refine: 타입 가드 6개(공유 가능한 것) + `clamp1to5` + `sanitizeConstraints` 제거, refine 전용 가드(`isMilkTreatment`, `isTopping`, `isGrind`)만 잔존
  - 효과: 약 80줄 중복 제거. 향후 새 enum/필드 추가 시 한 곳만 수정하면 양쪽에 반영됨.
- **문서**: `CHANGELOG.md` 신설
  - 이유: 팀원별 작업 추적용. 앞으로 모든 수정은 이 파일에 기록.
- **검증**: `cd website && npm run check` 통과 — 321 파일 / 0 ERRORS / 0 WARNINGS

---

<!-- 새 항목은 이 줄 위에 추가 -->
