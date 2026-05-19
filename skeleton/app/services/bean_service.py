"""원두 추천 서비스.

샘플 원두 데이터(``app/data/beans_mock.json``)를 읽어, 직접 구현한 그리디
알고리즘(:func:`greedy_recommend`)으로 사용자 취향에 맞는 최저가 원두를
추천한다. 추후 다나와 크롤러가 완성되면 이 로더만 교체하면 된다.
"""

from __future__ import annotations

import json
from pathlib import Path

from app.algorithms.greedy import greedy_recommend
from app.schemas.bean import Bean, BeanRecommendRequest, BeanRecommendResponse

_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "beans_mock.json"

# 원두 목록은 변하지 않으므로 한 번만 로드해 캐싱한다.
_beans_cache: list[Bean] | None = None


def load_beans() -> list[Bean]:
    """샘플 원두 데이터를 읽어 Bean 리스트로 반환한다 (최초 1회 로드)."""
    global _beans_cache
    if _beans_cache is None:
        with _DATA_PATH.open(encoding="utf-8") as f:
            raw = json.load(f)
        _beans_cache = [Bean(**item) for item in raw]
    return _beans_cache


def recommend_beans(req: BeanRecommendRequest) -> BeanRecommendResponse:
    """취향·예산을 받아 그리디 기반 원두 추천 결과를 돌려준다."""
    beans = load_beans()
    recommendations = greedy_recommend(
        req.profile,
        beans,
        top_k=req.top_k,
        min_match_score=req.min_match_score,
        budget_krw=req.budget_krw,
    )
    return BeanRecommendResponse(recommendations=recommendations)
