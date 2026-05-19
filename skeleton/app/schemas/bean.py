from pydantic import BaseModel, Field

from app.schemas.preference import TasteProfile


class Bean(BaseModel):
    id: str
    name: str
    brand: str
    price_krw: int = Field(..., description="판매 단위 전체 가격 (원). 100g 환산은 price_per_100g 로 계산")
    weight_g: int = Field(..., description="실제 판매 단위 중량 (g)")
    roast_level: int = Field(..., ge=1, le=5)
    acidity: int = Field(..., ge=1, le=5)
    body: int = Field(..., ge=1, le=5)
    sweetness: int = Field(..., ge=1, le=5)
    bitterness: int = Field(..., ge=1, le=5)
    origin: str
    flavor_notes: list[str] = Field(default_factory=list)
    url: str | None = None


class BeanRecommendRequest(BaseModel):
    profile: TasteProfile
    budget_krw: int | None = Field(None, ge=0, description="100g 환산 예산. None이면 무제한")
    top_k: int = Field(5, ge=1, le=20)
    min_match_score: float = Field(
        0.6, ge=0.0, le=1.0, description="후보 채택 최소 적합도 (0~1)"
    )


class BeanRecommendation(BaseModel):
    bean: Bean
    match_score: float = Field(..., ge=0.0, le=1.0)
    price_per_100g_krw: int


class BeanRecommendResponse(BaseModel):
    recommendations: list[BeanRecommendation]
