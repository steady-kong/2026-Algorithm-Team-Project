"""원두 추천 서비스 테스트 (샘플 데이터 + 그리디 연동)."""

from app.schemas.bean import BeanRecommendRequest
from app.schemas.preference import TasteProfile
from app.services.bean_service import load_beans, recommend_beans


def _req(**overrides) -> BeanRecommendRequest:
    defaults = dict(
        profile=TasteProfile(
            acidity=3, body=3, sweetness=3, bitterness=3, roast_level=3
        ),
        top_k=5,
        min_match_score=0.0,
    )
    defaults.update(overrides)
    return BeanRecommendRequest(**defaults)


def test_sample_dataset_loads():
    beans = load_beans()
    assert len(beans) >= 10


def test_recommend_respects_top_k():
    resp = recommend_beans(_req(top_k=3))
    assert len(resp.recommendations) <= 3


def test_recommend_is_sorted_by_price_ascending():
    resp = recommend_beans(_req(top_k=20))
    prices = [r.price_per_100g_krw for r in resp.recommendations]
    assert prices == sorted(prices)


def test_budget_filter_excludes_expensive_beans():
    resp = recommend_beans(_req(top_k=20, budget_krw=8000))
    for r in resp.recommendations:
        assert r.price_per_100g_krw <= 8000


def test_high_threshold_narrows_results():
    loose = recommend_beans(_req(top_k=20, min_match_score=0.0))
    strict = recommend_beans(_req(top_k=20, min_match_score=0.95))
    assert len(strict.recommendations) <= len(loose.recommendations)
