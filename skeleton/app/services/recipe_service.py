"""레시피 생성 서비스.

추출 기구별 기준 레시피에서 파라미터를 보정해 후보 레시피들을 만들고, 각
후보가 사용자 취향에 얼마나 부합하는지 점수화한 뒤 직접 구현한 ``merge_sort``
로 정렬해 1순위 + 차선책을 돌려준다.

- Upstage API 키가 있으면 LLM 이 후보를 생성하고, 없거나 실패하면 공식 기반
  규칙 폴백으로 후보를 생성한다.
- 어느 경로로 생성됐든 점수 계산(:func:`_score`)과 정렬은 동일하게 적용되므로,
  정렬 알고리즘은 항상 시스템에 관여한다.
- (취향 + 기구 + 후보 수) → 결과는 직접 구현한 ``HashTable`` 로 캐싱한다.

점수 모델은 추출 변수(물 온도·비율·분쇄도)가 컵 프로파일에 끼치는 영향을
단순 선형으로 근사한 휴리스틱이다. 정밀한 추출 이론이 아니라, 알고리즘
파이프라인(후보 생성 → 점수화 → 정렬)을 구동하기 위한 모델이다.
"""

from __future__ import annotations

import httpx

from app.algorithms.hashing import HashTable
from app.algorithms.sorting import merge_sort
from app.schemas.common import BrewMethod
from app.schemas.preference import TasteProfile
from app.schemas.recipe import (
    Recipe,
    RecipeGenerateRequest,
    RecipeGenerateResponse,
    RecipeStep,
)
from app.services.llm_client import LLMResponseError, NotConfiguredError, llm_client

# 분쇄도 단계: 인덱스가 작을수록 곱게(fine), 클수록 굵게(coarse).
_GRIND_ORDER = (
    "extra-fine",
    "fine",
    "medium-fine",
    "medium",
    "medium-coarse",
    "coarse",
)

# 기구별 기준 레시피. ratio = water_g / dose_g.
_BASE: dict[BrewMethod, dict] = {
    BrewMethod.HAND_DRIP: dict(
        dose=20.0, ratio=16.0, temp=92.0, grind="medium", bloom=30, total=180
    ),
    BrewMethod.MOKA_POT: dict(
        dose=18.0, ratio=10.0, temp=95.0, grind="fine", bloom=None, total=300
    ),
    BrewMethod.ESPRESSO_MACHINE: dict(
        dose=18.0, ratio=2.0, temp=93.0, grind="extra-fine", bloom=None, total=30
    ),
    BrewMethod.AEROPRESS: dict(
        dose=15.0, ratio=15.0, temp=85.0, grind="medium-fine", bloom=30, total=150
    ),
    BrewMethod.FRENCH_PRESS: dict(
        dose=30.0, ratio=16.0, temp=95.0, grind="coarse", bloom=30, total=240
    ),
}

# 기구별 기준 컵 프로파일(산미·바디·단맛·쓴맛). 로스팅은 원두가 결정하므로 제외.
_BASE_CUP: dict[BrewMethod, dict[str, float]] = {
    BrewMethod.HAND_DRIP: {"acidity": 4, "body": 2, "sweetness": 3, "bitterness": 2},
    BrewMethod.MOKA_POT: {"acidity": 2, "body": 4, "sweetness": 3, "bitterness": 4},
    BrewMethod.ESPRESSO_MACHINE: {"acidity": 3, "body": 5, "sweetness": 3, "bitterness": 4},
    BrewMethod.AEROPRESS: {"acidity": 3, "body": 3, "sweetness": 4, "bitterness": 2},
    BrewMethod.FRENCH_PRESS: {"acidity": 2, "body": 5, "sweetness": 3, "bitterness": 3},
}

# 후보 변형: (물온도 보정 ℃, 비율 보정, 분쇄도 단계 보정[+면 더 곱게]).
_VARIATIONS: tuple[tuple[float, float, int], ...] = (
    (0.0, 0.0, 0),
    (2.0, -1.0, 1),
    (-3.0, 1.0, -1),
    (4.0, -2.0, 1),
    (-2.0, 2.0, 0),
)

# 추출 변수가 컵 프로파일에 끼치는 영향 계수 (1단위 변화당).
_K_TEMP = {"acidity": -0.15, "body": 0.15, "sweetness": -0.05, "bitterness": 0.20}
_K_RATIO = {"acidity": 0.15, "body": -0.20, "sweetness": -0.12, "bitterness": -0.15}
_K_GRIND = {"acidity": -0.25, "body": 0.25, "sweetness": -0.08, "bitterness": 0.30}

_CUP_DIMS = ("acidity", "body", "sweetness", "bitterness")

# (취향 + 기구 + 후보 수) → RecipeGenerateResponse 캐시. 직접 구현한 HashTable 사용.
_cache: HashTable = HashTable()


def _cache_key(req: RecipeGenerateRequest) -> tuple:
    p = req.profile
    return (
        p.acidity,
        p.body,
        p.sweetness,
        p.bitterness,
        p.roast_level,
        req.brew_method.value,
        req.n_candidates,
    )


def _grind_index(grind: str) -> int:
    """분쇄도 문자열을 _GRIND_ORDER 인덱스로 변환. 알 수 없으면 medium."""
    s = grind.strip().lower().replace("_", "-").replace(" ", "-")
    if "extra" in s and "fine" in s:
        return 0
    if "medium-fine" in s:
        return 2
    if "medium-coarse" in s:
        return 4
    if "coarse" in s:
        return 5
    if "fine" in s:
        return 1
    if "medium" in s:
        return 3
    return 3


def _predict_cup(
    method: BrewMethod, temp: float, ratio: float, grind_index: int
) -> dict[str, float]:
    """추출 변수로부터 예상 컵 프로파일(4차원, 1~5 float)을 추정한다."""
    base = _BASE[method]
    cup = dict(_BASE_CUP[method])
    d_temp = temp - base["temp"]
    d_ratio = ratio - base["ratio"]
    # 기준보다 곱으면(인덱스가 작으면) 양수.
    d_grind = _grind_index(base["grind"]) - grind_index
    for dim in _CUP_DIMS:
        val = (
            cup[dim]
            + _K_TEMP[dim] * d_temp
            + _K_RATIO[dim] * d_ratio
            + _K_GRIND[dim] * d_grind
        )
        cup[dim] = max(1.0, min(5.0, val))
    return cup


def _score(cup: dict[str, float], profile: TasteProfile) -> float:
    """예상 컵 프로파일과 취향의 일치도. 0~1 (높을수록 좋음).

    컵에 직접 반영되는 4개 차원만 비교한다. 로스팅은 원두 선택에서 다룬다.
    """
    total = 0.0
    for dim in _CUP_DIMS:
        diff = abs(cup[dim] - getattr(profile, dim))
        total += 1.0 - diff / 4.0
    return total / len(_CUP_DIMS)


def _make_steps(dose: float, water: float, bloom: int | None, total: int) -> list[RecipeStep]:
    steps: list[RecipeStep] = []
    order = 1
    if bloom is not None:
        steps.append(
            RecipeStep(
                order=order,
                description=f"원두 {dose:g}g 에 물 약 {round(dose * 2):g}g 를 부어 {bloom}초간 뜸들이기",
                duration_sec=bloom,
            )
        )
        order += 1
    pour = total - (bloom or 0)
    steps.append(
        RecipeStep(
            order=order,
            description=f"물 총 {water:g}g 까지 나누어 부으며 추출",
            duration_sec=max(0, pour),
        )
    )
    order += 1
    steps.append(
        RecipeStep(order=order, description="추출을 마치고 잔에 옮겨 마시기", duration_sec=None)
    )
    return steps


def _build_recipe(
    method: BrewMethod,
    *,
    dose: float,
    ratio: float,
    temp: float,
    grind_index: int,
    bloom: int | None,
    total: int,
    profile: TasteProfile,
    source: str,
) -> Recipe:
    """파라미터로부터 점수가 매겨진 Recipe 객체를 만든다."""
    grind_index = max(0, min(len(_GRIND_ORDER) - 1, grind_index))
    water = round(dose * ratio, 1)
    cup = _predict_cup(method, temp, ratio, grind_index)
    score = _score(cup, profile)
    cup_txt = "산미 {acidity}/바디 {body}/단맛 {sweetness}/쓴맛 {bitterness}".format(
        **{k: round(v) for k, v in cup.items()}
    )
    return Recipe(
        brew_method=method,
        grind_size=_GRIND_ORDER[grind_index],
        dose_g=round(dose, 1),
        water_g=water,
        water_temp_c=round(temp, 1),
        bloom_sec=bloom,
        total_time_sec=total,
        steps=_make_steps(dose, water, bloom, total),
        score=round(score, 4),
        notes=f"{source} · 예상 컵 프로파일 {cup_txt}",
    )


def rule_based_generate(req: RecipeGenerateRequest) -> list[Recipe]:
    """공식 기반 폴백: 기준 레시피에서 파라미터를 보정해 후보를 만든다. (동기)"""
    method = req.brew_method
    base = _BASE[method]
    base_grind_idx = _grind_index(base["grind"])
    recipes: list[Recipe] = []
    for d_temp, d_ratio, d_grind in _VARIATIONS[: req.n_candidates]:
        recipes.append(
            _build_recipe(
                method,
                dose=base["dose"],
                ratio=max(1.0, base["ratio"] + d_ratio),
                temp=base["temp"] + d_temp,
                grind_index=base_grind_idx - d_grind,
                bloom=base["bloom"],
                total=base["total"],
                profile=req.profile,
                source="규칙 기반 폴백",
            )
        )
    return recipes


_SYSTEM_PROMPT = (
    "너는 바리스타다. 주어진 취향과 추출 기구에 맞는 커피 레시피 후보들을 JSON "
    "으로만 답하라. 형식: {\"recipes\": [{\"grind_size\": str, \"dose_g\": number, "
    "\"water_g\": number, \"water_temp_c\": number, \"bloom_sec\": number|null, "
    "\"total_time_sec\": number, \"notes\": str}]}. 요청한 개수만큼 서로 다른 "
    "후보를 제시하라."
)


async def _llm_generate(req: RecipeGenerateRequest) -> list[Recipe]:
    """LLM 으로 후보 레시피를 생성한다. 점수는 우리 모델로 다시 매긴다."""
    user = (
        f"추출 기구: {req.brew_method.value}\n"
        f"취향(1~5): 산미 {req.profile.acidity}, 바디 {req.profile.body}, "
        f"단맛 {req.profile.sweetness}, 쓴맛 {req.profile.bitterness}, "
        f"로스팅 {req.profile.roast_level}\n"
        f"후보 개수: {req.n_candidates}"
    )
    data = await llm_client.chat_json(_SYSTEM_PROMPT, user)
    raw = data.get("recipes")
    if not isinstance(raw, list) or not raw:
        raise LLMResponseError(f"recipes 배열이 비어있거나 형식 오류: {data}")

    recipes: list[Recipe] = []
    for item in raw[: req.n_candidates]:
        dose = float(item["dose_g"])
        water = float(item["water_g"])
        ratio = water / dose if dose > 0 else _BASE[req.brew_method]["ratio"]
        bloom_raw = item.get("bloom_sec")
        recipes.append(
            _build_recipe(
                req.brew_method,
                dose=dose,
                ratio=ratio,
                temp=float(item["water_temp_c"]),
                grind_index=_grind_index(str(item.get("grind_size", "medium"))),
                bloom=int(bloom_raw) if bloom_raw is not None else None,
                total=int(item["total_time_sec"]),
                profile=req.profile,
                source="Upstage LLM 생성",
            )
        )
    return recipes


async def generate_recipes(req: RecipeGenerateRequest) -> RecipeGenerateResponse:
    """레시피 후보를 생성·점수화·정렬해 1순위와 차선책을 돌려준다.

    동일 요청은 HashTable 캐시에서 즉시 반환한다. LLM 호출이 실패하면(키 미설정
    포함) 규칙 기반 폴백으로 자동 전환한다.
    """
    key = _cache_key(req)
    cached = _cache.get(key)
    if cached is not None:
        return cached

    try:
        recipes = await _llm_generate(req)
    except (
        NotConfiguredError,
        LLMResponseError,
        httpx.HTTPError,
        KeyError,
        ValueError,
        TypeError,
    ):
        recipes = rule_based_generate(req)

    # 직접 구현한 merge_sort 로 점수 내림차순 정렬 (동점이면 생성 순서 유지).
    ordered = merge_sort(recipes, key=lambda r: r.score, reverse=True)
    response = RecipeGenerateResponse(best=ordered[0], alternatives=ordered[1:])
    _cache.put(key, response)
    return response
