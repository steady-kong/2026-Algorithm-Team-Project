from pydantic import BaseModel, Field

from app.schemas.common import BrewMethod


class TasteProfile(BaseModel):
    """1~5 정수로 표현된 사용자 취향 프로파일."""

    acidity: int = Field(..., ge=1, le=5, description="산미 (1=약함 ~ 5=강함)")
    body: int = Field(..., ge=1, le=5, description="바디감 (1=가벼움 ~ 5=묵직함)")
    sweetness: int = Field(..., ge=1, le=5, description="단맛 (1=드라이 ~ 5=달콤)")
    bitterness: int = Field(..., ge=1, le=5, description="쓴맛 (1=약함 ~ 5=강함)")
    roast_level: int = Field(..., ge=1, le=5, description="로스팅 (1=라이트 ~ 5=다크)")


class PreferenceParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="사용자가 입력한 자유 텍스트")
    brew_method: BrewMethod = Field(..., description="사용할 추출 기구")


class PreferenceParseResponse(BaseModel):
    profile: TasteProfile
    rationale: str = Field(..., description="LLM이 해당 점수를 부여한 이유 요약")
