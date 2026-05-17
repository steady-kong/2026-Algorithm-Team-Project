"""원두 그리디 선택.

전략: 사용자 취향과의 적합도가 임계치 이상인 후보들 중에서 100g 환산 가격을
기준으로 작은 순서대로 top_k 개를 즉시 선택한다. 매 단계에서 "현재 가장 싼
후보"를 그리디하게 고르므로 가격 측면에서 지역 최적이며, 적합도 임계치라는
제약 하에서 전역 최적(가격 기준)을 보장한다.

적합도(match_score) 는 0~1 로 정규화된다. 각 차원의 절대 차이를 최대 4 로
나누어 1 에서 빼고, 평균을 낸다.
"""

from __future__ import annotations

from app.algorithms.sorting import merge_sort
from app.schemas.bean import Bean, BeanRecommendation
from app.schemas.preference import TasteProfile


_DIMENSIONS = ("acidity", "body", "sweetness", "bitterness", "roast_level")


def compute_match_score(profile: TasteProfile, bean: Bean) -> float:
    """1~5 척도 5개 차원의 평균 정규화 유사도. 0~1."""
    total = 0.0
    for dim in _DIMENSIONS:
        diff = abs(getattr(profile, dim) - getattr(bean, dim))
        total += 1.0 - diff / 4.0
    return total / len(_DIMENSIONS)


def price_per_100g(bean: Bean) -> int:
    """판매 단위 가격을 100g 환산 가격으로 변환."""
    if bean.weight_g <= 0:
        return bean.price_krw
    return round(bean.price_krw * 100 / bean.weight_g)


def greedy_recommend(
    profile: TasteProfile,
    beans: list[Bean],
    *,
    top_k: int = 5,
    min_match_score: float = 0.6,
    budget_krw: int | None = None,
) -> list[BeanRecommendation]:
    """그리디 원두 추천.

    1) 모든 원두에 대해 적합도를 계산한다.
    2) min_match_score 이상이고 (예산이 있다면) 예산 이하인 원두만 후보로 둔다.
    3) 100g 환산 가격 오름차순으로 정렬한다(직접 구현한 merge_sort 사용).
    4) 앞에서부터 top_k 개를 그리디하게 선택한다.
    """
    candidates: list[BeanRecommendation] = []
    for bean in beans:
        score = compute_match_score(profile, bean)
        if score < min_match_score:
            continue
        unit_price = price_per_100g(bean)
        if budget_krw is not None and unit_price > budget_krw:
            continue
        candidates.append(
            BeanRecommendation(
                bean=bean,
                match_score=round(score, 4),
                price_per_100g_krw=unit_price,
            )
        )

    sorted_candidates = merge_sort(
        candidates, key=lambda r: r.price_per_100g_krw, reverse=False
    )
    return sorted_candidates[:top_k]
