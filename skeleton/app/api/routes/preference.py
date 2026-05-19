"""취향 파싱 API 라우트."""

from fastapi import APIRouter

from app.schemas.preference import PreferenceParseRequest, PreferenceParseResponse
from app.services.preference_service import parse_preference

router = APIRouter()


@router.post("/parse", response_model=PreferenceParseResponse)
async def parse(req: PreferenceParseRequest) -> PreferenceParseResponse:
    """자유 텍스트를 1~5 척도의 구조화된 취향 프로파일로 변환한다.

    Upstage API 키가 없으면 키워드 기반 규칙 폴백으로 처리된다.
    """
    return await parse_preference(req)
