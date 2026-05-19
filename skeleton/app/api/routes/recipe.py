"""레시피 생성 및 추천 이력 API 라우트."""

from datetime import datetime

from fastapi import APIRouter, Query

from app.schemas.history import HistoryResponse
from app.schemas.recipe import RecipeGenerateRequest, RecipeGenerateResponse
from app.services.history_store import history_store
from app.services.recipe_service import generate_recipes

router = APIRouter()


@router.post("/generate", response_model=RecipeGenerateResponse)
async def generate(req: RecipeGenerateRequest) -> RecipeGenerateResponse:
    """취향과 추출 기구를 받아 점수순으로 정렬된 레시피 후보를 돌려준다.

    Upstage API 키가 없으면 공식 기반 규칙 폴백으로 후보를 생성한다.
    """
    response = await generate_recipes(req)
    history_store.record(
        kind="recipe",
        summary=f"{req.brew_method.value} 레시피 추천 "
        f"(1순위 적합도 {response.best.score})",
    )
    return response


@router.get("/history", response_model=HistoryResponse)
def history(
    limit: int = Query(10, ge=1, le=100, description="반환할 최대 이력 수"),
    since: datetime | None = Query(None, description="조회 시작 시각 (ISO 8601)"),
    until: datetime | None = Query(None, description="조회 종료 시각 (ISO 8601)"),
) -> HistoryResponse:
    """추천 이력을 최신순으로 조회한다.

    since/until 중 하나라도 주어지면 RBT 의 범위 질의로 해당 기간을 조회하고,
    둘 다 없으면 가장 최근 이력을 반환한다.
    """
    if since is not None or until is not None:
        entries = history_store.range(since, until, limit)
    else:
        entries = history_store.recent(limit)
    return HistoryResponse(total=len(history_store), entries=entries)
