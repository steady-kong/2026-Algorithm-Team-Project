"""원두 추천 API 라우트."""

from fastapi import APIRouter

from app.schemas.bean import BeanRecommendRequest, BeanRecommendResponse
from app.services.bean_service import recommend_beans
from app.services.history_store import history_store

router = APIRouter()


@router.post("/recommend", response_model=BeanRecommendResponse)
def recommend(req: BeanRecommendRequest) -> BeanRecommendResponse:
    """취향과 예산을 받아 그리디 기반으로 최적의 원두를 추천한다."""
    response = recommend_beans(req)
    history_store.record(
        kind="beans",
        summary=f"원두 추천 {len(response.recommendations)}건 "
        f"(예산 {req.budget_krw if req.budget_krw is not None else '무제한'})",
    )
    return response
