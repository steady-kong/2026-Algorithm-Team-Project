from app.algorithms.greedy import compute_match_score, greedy_recommend, price_per_100g
from app.schemas.bean import Bean
from app.schemas.preference import TasteProfile


def _bean(**overrides) -> Bean:
    defaults = dict(
        id="b1",
        name="Sample",
        brand="Brand",
        price_krw=20000,
        weight_g=200,
        roast_level=3,
        acidity=3,
        body=3,
        sweetness=3,
        bitterness=3,
        origin="Ethiopia",
        flavor_notes=["floral"],
        url=None,
    )
    defaults.update(overrides)
    return Bean(**defaults)


def _profile(**overrides) -> TasteProfile:
    defaults = dict(acidity=3, body=3, sweetness=3, bitterness=3, roast_level=3)
    defaults.update(overrides)
    return TasteProfile(**defaults)


def test_match_score_perfect_match_is_one():
    assert compute_match_score(_profile(), _bean()) == 1.0


def test_match_score_max_distance():
    p = _profile(acidity=1, body=1, sweetness=1, bitterness=1, roast_level=1)
    b = _bean(acidity=5, body=5, sweetness=5, bitterness=5, roast_level=5)
    assert compute_match_score(p, b) == 0.0


def test_price_per_100g():
    assert price_per_100g(_bean(price_krw=20000, weight_g=200)) == 10000
    assert price_per_100g(_bean(price_krw=15000, weight_g=250)) == 6000


def test_greedy_picks_cheapest_above_threshold():
    p = _profile()
    beans = [
        _bean(id="cheap_bad", price_krw=5000, weight_g=200, acidity=5, body=5),
        _bean(id="cheap_good", price_krw=8000, weight_g=200),
        _bean(id="mid_good", price_krw=12000, weight_g=200),
        _bean(id="exp_good", price_krw=30000, weight_g=200),
    ]
    out = greedy_recommend(p, beans, top_k=2, min_match_score=0.8)
    ids = [r.bean.id for r in out]
    assert ids == ["cheap_good", "mid_good"]


def test_greedy_respects_budget():
    p = _profile()
    beans = [
        _bean(id="a", price_krw=10000, weight_g=200),  # 5000/100g
        _bean(id="b", price_krw=30000, weight_g=200),  # 15000/100g
    ]
    out = greedy_recommend(p, beans, top_k=5, min_match_score=0.5, budget_krw=10000)
    assert [r.bean.id for r in out] == ["a"]


def test_greedy_empty_when_all_below_threshold():
    p = _profile(acidity=1)
    beans = [_bean(acidity=5)]
    out = greedy_recommend(p, beans, min_match_score=0.95)
    assert out == []
