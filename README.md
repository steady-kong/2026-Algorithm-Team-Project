# ☕ LLM 기반 맞춤형 커피 레시피 추천 & 원두 최적화 시스템

> 사용자의 세밀한 맛 취향을 LLM(Upstage API)으로 분석하고, 자료구조·알고리즘
> 수업에서 배운 개념들을 **표준 라이브러리에 의존하지 않고 직접 구현**하여,
> 최적의 커피 레시피와 원두 구매 선택지를 제공하는 웹 애플리케이션.

**2026 Algorithm Team Project**

---

## 📑 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [현재 구현 상태](#2-현재-구현-상태)
3. [주요 기능](#3-주요-기능)
4. [직접 구현한 알고리즘](#4-직접-구현한-알고리즘)
5. [시스템 구성 및 데이터 흐름](#5-시스템-구성-및-데이터-흐름)
6. [기술 스택](#6-기술-스택)
7. [디렉터리 구조](#7-디렉터리-구조)
8. [도메인 모델](#8-도메인-모델)
9. [API 레퍼런스](#9-api-레퍼런스)
10. [실행 방법](#10-실행-방법)
11. [테스트](#11-테스트)
12. [LLM 폴백 동작](#12-llm-폴백-동작)
13. [앞으로의 계획](#13-앞으로의-계획)

---

## 1. 프로젝트 개요

자유 입력으로 받은 사용자의 커피 취향(예: *"바디감 높고 산미 있는 커피"*)을
LLM이 1~5단계의 구조화된 파라미터(산미·바디감·단맛·쓴맛·로스팅)로 변환한 뒤,
추출 기구별 최적 레시피와 사용자 취향에 맞는 최저가 원두를 추천한다.

이 프로젝트의 핵심은 **LLM에만 의존하지 않는다**는 점이다. 수업에서 다룬
**정렬(Sorting)**, **그리디(Greedy)**, **해싱(Hashing)**, **레드블랙 트리(RBT)** 를
직접 구현하여 추천 파이프라인 곳곳에 적용했다. LLM은 자연어 이해만 담당하고,
점수화·정렬·캐싱·이력 관리 등 시스템의 핵심 로직은 직접 구현한 알고리즘이
처리한다.

---

## 2. 현재 구현 상태

> 이 문서는 **백엔드 1차 구현 완료 시점**의 진행 상황을 정리한 것이다.

| 영역 | 상태 | 비고 |
|------|:----:|------|
| 기획 및 알고리즘 선정 | ✅ 완료 | |
| 알고리즘 4종 from-scratch 구현 | ✅ 완료 | 정렬·해싱·그리디·RBT |
| Pydantic 스키마 정의 | ✅ 완료 | 취향·레시피·원두·이력 |
| 샘플 원두 데이터셋 | ✅ 완료 | `beans_mock.json`, 18종 |
| 서비스 계층 (취향·레시피·원두·이력) | ✅ 완료 | LLM 규칙 기반 폴백 포함 |
| FastAPI 라우트 (4개 엔드포인트) | ✅ 완료 | 앱 실행 가능 |
| 단위·통합 테스트 | ✅ 완료 | 9개 테스트 모듈 |
| Upstage API 키 연결 / 실 LLM 검증 | ⏳ 예정 | 키 준비되면 진행 |
| SvelteKit 프론트엔드 | ⏳ 예정 | |
| Docker dev 환경 | ⏳ 예정 | |
| 다나와 크롤러 스켈레톤 | ⏳ 예정 | |

**한 줄 요약**: API 키 없이도 `uvicorn` 으로 백엔드를 띄워 4개 엔드포인트
전체를 호출·테스트할 수 있는 상태이다.

---

## 3. 주요 기능

| # | 기능 | 설명 | 상태 |
|---|------|------|:----:|
| 1 | 취향 입력 & 파싱 | 자유 텍스트 → 산미/바디/단맛/쓴맛/로스팅 1~5단계 분류 | ✅ |
| 2 | 맞춤 레시피 생성 | 추출 기구별 분쇄도·뜸들이기·물 온도/양 산출 | ✅ |
| 3 | 레시피 후보 정렬 | 후보마다 취향 적합도 점수를 매겨 1순위 + 차선책 제공 | ✅ |
| 4 | 원두 추천 | 취향 적합도 + 가격을 함께 고려한 그리디 기반 선택 | ✅ |
| 5 | 추천 이력 관리 | RBT 기반으로 최근/기간별 추천 이력 조회 | ✅ |

---

## 4. 직접 구현한 알고리즘

모든 자료구조/알고리즘은 `backend/app/algorithms/` 아래에 **`sorted`, `dict`,
`bisect` 등 표준 라이브러리 없이** 직접 구현되어 있으며, 각 모듈마다 단위
테스트가 있다.

### 4.1 정렬 — `sorting.py`

- **구현**: `merge_sort`(안정 정렬, O(n log n) 보장), `quick_sort`(Lomuto
  파티션, 평균 O(n log n)). 둘 다 `key`·`reverse` 인자를 지원한다.
- **적용 위치**:
  - `recipe_service` — 레시피 후보를 취향 적합도 점수 **내림차순**으로 정렬해
    1순위와 차선책을 나눈다. 동점 후보의 생성 순서를 보존하려고 **안정 정렬인
    `merge_sort`** 를 선택했다.
  - `greedy.py` — 원두 후보를 100g 환산 가격 **오름차순**으로 정렬한다.

### 4.2 해싱 — `hashing.py`

- **구현**: 개방 주소법(Open Addressing) + 선형 탐사(Linear Probing) 해시
  테이블. load factor 0.7 초과 시 용량을 2배로 리해시하고, tombstone 으로
  삭제를 지원한다.
- **적용 위치**: `recipe_service._cache` — `(취향 5차원, 추출 기구, 후보 수)`
  튜플을 키로 레시피 생성 결과를 캐싱한다. 같은 요청이 다시 오면 LLM 호출이나
  재계산 없이 평균 O(1) 으로 결과를 돌려준다.

### 4.3 그리디 — `greedy.py`

- **전략**: ① 모든 원두에 대해 취향 적합도를 계산한다. ② 적합도가 임계치
  이상이고 (예산이 있다면) 예산 이하인 원두만 후보로 둔다. ③ 100g 환산 가격
  오름차순으로 정렬한다. ④ 앞에서부터 `top_k` 개를 그리디하게 선택한다.
- **적합도(match_score)**: 산미·바디·단맛·쓴맛·로스팅 5개 차원의 절대 차이를
  최대값 4로 나눠 정규화한 유사도의 평균(0~1).
- **적용 위치**: `bean_service` 의 원두 추천.

### 4.4 레드블랙 트리 — `rbt.py`

- **구현**: CLRS 표준 알고리즘(삽입, 좌/우 회전, `_insert_fixup`)을 따른다.
  NIL 센티넬 노드를 사용하며, `inorder()`(키 오름차순 순회)와
  `range_search(lo, hi)`(범위 질의)를 제공한다.
- **적용 위치**: `history_store` — 추천이 일어날 때마다 `(기록 시각 ns,
  일련번호)` 튜플을 키로 이력을 삽입한다. RBT가 정렬 상태를 유지하므로 최근
  이력 조회는 `inorder`, 기간 조회는 `range_search` 로 처리하며, 삽입은
  O(log n) 이다.

---

## 5. 시스템 구성 및 데이터 흐름

```
[ 사용자 자유 텍스트 ]
        │
        ▼
POST /api/preference/parse ──▶ preference_service
        │                         ├─ Upstage LLM 분석  (키 있을 때)
        │                         └─ 키워드 규칙 폴백   (키 없을 때)
        ▼
   TasteProfile (산미·바디·단맛·쓴맛·로스팅, 각 1~5)
        │
        ├──────────────────────────────┐
        ▼                              ▼
POST /api/recipe/generate      POST /api/beans/recommend
   recipe_service                 bean_service
   ├─ 후보 생성 (LLM / 규칙)        └─ greedy_recommend()
   ├─ 적합도 점수화                     ├─ 적합도 필터 + 예산 필터
   ├─ merge_sort 정렬 ◀── Sorting       └─ merge_sort 가격 정렬 ◀── Sorting
   └─ HashTable 캐싱 ◀── Hashing
        │                              │
        └──────────────┬───────────────┘
                        ▼
              history_store.record()  ◀── Red-Black Tree
                        │
                        ▼
              GET /api/recipe/history  (최근순 / 기간 질의)
```

---

## 6. 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| Backend | FastAPI, Pydantic v2, Uvicorn (Python 3.11+) |
| LLM | Upstage API (Solar) — `httpx` 비동기 호출 |
| 알고리즘 | 표준 라이브러리 없이 순수 Python 으로 직접 구현 |
| 테스트 | pytest, FastAPI `TestClient` |
| 데이터 | 샘플 JSON 목업 (`beans_mock.json`) → 추후 다나와 크롤링으로 확장 예정 |
| 개발 환경 | Docker + docker-compose (예정) |
| Frontend | SvelteKit + TypeScript (예정) |

> ⚠️ **공급망 보안 주의**: npm/PyPI 공급망 공격을 고려해, 의존성 설치
> (`pip install` / `npm install`)는 **가능한 한 Docker dev container 안에서만**
> 수행한다. 호스트 환경 오염을 방지하기 위함이다.

---

## 7. 디렉터리 구조

현재 리포지토리에 **실제로 존재하는** 파일 기준이다. (`⏳` = 예정)

```
2026-Algorithm-Team-Project/
├── README.md
├── .env.example                  # 환경변수 템플릿
├── .gitignore
│
└── backend/                      # FastAPI 백엔드
    ├── requirements.txt
    ├── pytest.ini                # 테스트 import 경로 설정
    ├── app/
    │   ├── main.py               # FastAPI 앱 · CORS · 라우터 등록
    │   ├── config.py             # 환경변수 설정 (pydantic-settings)
    │   │
    │   ├── api/routes/
    │   │   ├── preference.py     # POST /api/preference/parse
    │   │   ├── recipe.py         # POST /api/recipe/generate, GET .../history
    │   │   └── beans.py          # POST /api/beans/recommend
    │   │
    │   ├── schemas/              # Pydantic 모델
    │   │   ├── common.py         # BrewMethod (추출 기구 Enum)
    │   │   ├── preference.py     # TasteProfile, 취향 파싱 요청/응답
    │   │   ├── recipe.py         # Recipe, RecipeStep, 레시피 요청/응답
    │   │   ├── bean.py           # Bean, 원두 추천 요청/응답
    │   │   └── history.py        # HistoryEntry, 이력 응답
    │   │
    │   ├── services/             # 비즈니스 로직
    │   │   ├── llm_client.py          # Upstage API 비동기 래퍼
    │   │   ├── preference_service.py  # 취향 파싱 + 키워드 규칙 폴백
    │   │   ├── recipe_service.py      # 레시피 생성·점수화·정렬 + 캐시
    │   │   ├── bean_service.py        # 원두 로드 + 그리디 추천
    │   │   └── history_store.py       # RBT 기반 추천 이력 저장소
    │   │
    │   ├── algorithms/           # 표준 라이브러리 없이 직접 구현
    │   │   ├── sorting.py        # merge_sort, quick_sort
    │   │   ├── hashing.py        # HashTable (개방 주소법)
    │   │   ├── greedy.py         # 원두 그리디 추천
    │   │   └── rbt.py            # RedBlackTree
    │   │
    │   └── data/
    │       └── beans_mock.json   # 샘플 원두 18종
    │
    └── tests/                    # 9개 테스트 모듈
        ├── test_sorting.py            # 알고리즘 단위 테스트
        ├── test_hashing.py
        ├── test_greedy.py
        ├── test_rbt.py
        ├── test_preference_service.py # 서비스 테스트
        ├── test_recipe_service.py
        ├── test_bean_service.py
        ├── test_history_store.py
        └── test_api.py                # API 통합 테스트

⏳ frontend/            # SvelteKit + TypeScript (예정)
⏳ crawler/             # 다나와 크롤러 스켈레톤 (예정)
⏳ docker-compose.yml   # Docker dev 환경 (예정)
```

---

## 8. 도메인 모델

### 8.1 취향 파라미터 — `TasteProfile` (각 1~5 정수)

| 필드 | 의미 | 범위 |
|------|------|------|
| `acidity` | 산미 | 1=약함 ~ 5=강함 |
| `body` | 바디감 | 1=가벼움 ~ 5=묵직함 |
| `sweetness` | 단맛 | 1=드라이 ~ 5=달콤 |
| `bitterness` | 쓴맛 | 1=약함 ~ 5=강함 |
| `roast_level` | 선호 로스팅 | 1=라이트 ~ 5=다크 |

### 8.2 추출 기구 — `BrewMethod`

`hand_drip`(핸드드립), `moka_pot`(모카포트), `espresso_machine`(에스프레소
머신), `aeropress`(에어로프레스), `french_press`(프렌치프레스)

### 8.3 원두 — `Bean`

`id`, `name`, `brand`, `price_krw`(판매 단위 전체 가격), `weight_g`(판매 단위
중량), `roast_level`, `acidity`, `body`, `sweetness`, `bitterness`, `origin`,
`flavor_notes`, `url`. 100g 환산 가격은 `price_krw × 100 / weight_g` 로
계산한다.

---

## 9. API 레퍼런스

베이스 URL: `http://localhost:8000` · 자동 문서: `/docs`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/preference/parse` | 자유 텍스트 → 구조화된 취향 |
| `POST` | `/api/recipe/generate` | 취향 + 기구 → 정렬된 레시피 후보 |
| `GET`  | `/api/recipe/history` | 추천 이력 조회 (최근순 / 기간 질의) |
| `POST` | `/api/beans/recommend` | 취향 + 예산 → 그리디 기반 원두 추천 |
| `GET`  | `/api/health` | 헬스 체크 |

### 9.1 `POST /api/preference/parse`

```jsonc
// 요청
{ "text": "바디감 묵직하고 산미 있는 커피", "brew_method": "hand_drip" }

// 응답
{
  "profile": { "acidity": 4, "body": 4, "sweetness": 3,
               "bitterness": 3, "roast_level": 3 },
  "rationale": "키워드 기반 추정 — 바디감 강함(4), 산미 강함(4). ..."
}
```

### 9.2 `POST /api/recipe/generate`

```jsonc
// 요청
{
  "profile": { "acidity": 4, "body": 4, "sweetness": 3,
               "bitterness": 3, "roast_level": 3 },
  "brew_method": "hand_drip",
  "n_candidates": 3
}

// 응답: 점수 내림차순으로 정렬된 best + alternatives
{
  "best": {
    "brew_method": "hand_drip", "grind_size": "medium",
    "dose_g": 20.0, "water_g": 320.0, "water_temp_c": 92.0,
    "bloom_sec": 30, "total_time_sec": 180,
    "steps": [ { "order": 1, "description": "...", "duration_sec": 30 } ],
    "score": 0.87, "notes": "규칙 기반 폴백 · 예상 컵 프로파일 ..."
  },
  "alternatives": [ /* Recipe ... */ ]
}
```

### 9.3 `GET /api/recipe/history`

쿼리: `limit`(기본 10), `since`·`until`(ISO 8601, 선택). `since`/`until` 중
하나라도 주어지면 RBT 범위 질의로 해당 기간을 조회한다.

```jsonc
// GET /api/recipe/history?limit=5
{
  "total": 12,
  "entries": [
    { "id": "h000012", "recorded_at": "2026-05-18T07:30:00+00:00",
      "kind": "recipe", "summary": "hand_drip 레시피 추천 (1순위 적합도 0.87)" }
  ]
}
```

### 9.4 `POST /api/beans/recommend`

```jsonc
// 요청
{
  "profile": { "acidity": 4, "body": 3, "sweetness": 4,
               "bitterness": 2, "roast_level": 3 },
  "budget_krw": 12000,      // 100g 환산 예산. null 이면 무제한
  "top_k": 5,
  "min_match_score": 0.6    // 후보 채택 최소 적합도 (0~1)
}

// 응답: 100g 환산 가격 오름차순
{
  "recommendations": [
    { "bean": { "id": "bean-004", "name": "콜롬비아 수프리모", /* ... */ },
      "match_score": 0.9, "price_per_100g_krw": 9000 }
  ]
}
```

---

## 10. 실행 방법

> Docker dev 환경은 아직 준비 중이다. 현재는 백엔드를 로컬에서 직접 실행한다.
> 의존성 설치는 가능하면 격리된 가상환경 또는 컨테이너 안에서 진행한다.

```bash
cd backend

# 1. 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. 의존성 설치
pip install -r requirements.txt

# 3. (선택) 환경변수 설정 — 키가 없어도 규칙 기반 폴백으로 동작한다
cp ../.env.example .env             # .env 의 UPSTAGE_API_KEY 를 채우면 실 LLM 사용

# 4. 서버 실행
uvicorn app.main:app --reload

# Swagger 문서:  http://localhost:8000/docs
```

---

## 11. 테스트

```bash
cd backend
pytest                # 전체 테스트 실행
pytest tests/test_api.py -v   # 특정 모듈만
```

테스트 구성:

- **알고리즘 단위 테스트** — `test_sorting`, `test_hashing`, `test_greedy`,
  `test_rbt`
- **서비스 테스트** — `test_preference_service`(규칙 폴백 키워드 추정),
  `test_recipe_service`(생성·점수·정렬·캐시), `test_bean_service`(그리디
  연동), `test_history_store`(RBT 이력)
- **API 통합 테스트** — `test_api` (FastAPI `TestClient` 로 4개 엔드포인트
  검증)

모든 테스트는 Upstage API 키 없이 실행되며, LLM 의존 경로는 규칙 기반 폴백을
탄다.

---

## 12. LLM 폴백 동작

LLM 의존 엔드포인트(`preference/parse`, `recipe/generate`)는 `UPSTAGE_API_KEY`
설정 여부와 무관하게 항상 동작한다.

| 상황 | 동작 |
|------|------|
| 키 설정됨 | Upstage Solar 모델로 분석/생성 |
| 키 없음 · LLM 오류 · 비정상 응답 | 규칙 기반 폴백으로 자동 전환 |

- **취향 파싱 폴백**: 차원별 한국어 키워드와 주변 강도 수식어(*매우/약간/없는*
  등)를 훑어 1~5 점수를 추정하는 휴리스틱.
- **레시피 생성 폴백**: 추출 기구별 기준 레시피에서 물 온도·비율·분쇄도를
  보정해 후보를 만드는 공식 기반 생성.

두 경로 어디로 생성됐든 **점수화·정렬·캐싱은 동일하게 적용**되므로, 직접 구현한
알고리즘은 항상 시스템에 관여한다. 덕분에 API 키가 없어도 전체 파이프라인을
검증할 수 있다.

> 추천 이력은 서버 프로세스 메모리에만 저장되며(DB 없음), 서버를 재시작하면
> 초기화된다. 학습용 프로젝트 범위에서 RBT 활용을 보이기 위한 구성이다.

---

## 13. 앞으로의 계획

- [ ] Upstage API 키 연결 및 실 LLM 호출 검증
- [ ] SvelteKit 프론트엔드 (취향 입력 / 레시피 결과 / 원두 추천 3개 화면)
- [ ] Docker + docker-compose dev 환경 구성
- [ ] 다나와 크롤러 스켈레톤 → 실 데이터 연동
- [ ] 시연 준비 (실제 추출 시연)

---

## 팀

**2026 Algorithm Team Project**
