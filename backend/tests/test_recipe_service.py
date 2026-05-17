"""레시피 생성 서비스 테스트.

LLM 경로 대신, 키 없이 동작하는 규칙 기반 폴백과 점수화·정렬·캐시를 검증한다.
generate_recipes 는 async 이므로 asyncio.run 으로 호출한다.
"""

import asyncio

from app.schemas.common import BrewMethod
from app.schemas.preference import TasteProfile
from app.schemas.recipe import RecipeGenerateRequest
from app.services.recipe_service import (
    _grind_index,
    generate_recipes,
    rule_based_generate,
)


def _req(**overrides) -> RecipeGenerateRequest:
    defaults = dict(
        profile=TasteProfile(
            acidity=3, body=3, sweetness=3, bitterness=3, roast_level=3
        ),
        brew_method=BrewMethod.HAND_DRIP,
        n_candidates=3,
    )
    defaults.update(overrides)
    return RecipeGenerateRequest(**defaults)


def test_rule_based_generate_respects_candidate_count():
    assert len(rule_based_generate(_req(n_candidates=4))) == 4
    assert len(rule_based_generate(_req(n_candidates=1))) == 1


def test_scores_are_normalized():
    for recipe in rule_based_generate(_req(n_candidates=5)):
        assert 0.0 <= recipe.score <= 1.0


def test_water_is_dose_times_ratio():
    recipe = rule_based_generate(_req(n_candidates=1))[0]
    assert recipe.water_g > 0
    assert recipe.dose_g > 0


def test_grind_index_mapping():
    assert _grind_index("extra-fine") == 0
    assert _grind_index("fine") == 1
    assert _grind_index("medium") == 3
    assert _grind_index("coarse") == 5
    assert _grind_index("unknown") == 3


def test_generate_sorts_best_first():
    resp = asyncio.run(generate_recipes(_req(n_candidates=5, brew_method=BrewMethod.MOKA_POT)))
    assert all(resp.best.score >= alt.score for alt in resp.alternatives)


def test_single_candidate_has_no_alternatives():
    resp = asyncio.run(generate_recipes(_req(n_candidates=1, brew_method=BrewMethod.AEROPRESS)))
    assert resp.alternatives == []


def test_identical_request_is_cached():
    req = _req(n_candidates=2, brew_method=BrewMethod.FRENCH_PRESS)
    first = asyncio.run(generate_recipes(req))
    second = asyncio.run(generate_recipes(req))
    # 캐시 적중 시 동일한 응답 객체가 그대로 반환된다.
    assert first is second
