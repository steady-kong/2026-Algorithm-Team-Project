from pydantic import BaseModel, Field

from app.schemas.common import BrewMethod
from app.schemas.preference import TasteProfile


class RecipeStep(BaseModel):
    order: int
    description: str
    duration_sec: int | None = None


class Recipe(BaseModel):
    brew_method: BrewMethod
    grind_size: str = Field(..., description="분쇄도 (예: medium-fine)")
    dose_g: float = Field(..., description="원두 사용량 (g)")
    water_g: float = Field(..., description="물 사용량 (g)")
    water_temp_c: float = Field(..., description="물 온도 (℃)")
    bloom_sec: int | None = Field(None, description="뜸들이기 시간 (초)")
    total_time_sec: int = Field(..., description="총 추출 시간 (초)")
    steps: list[RecipeStep] = Field(default_factory=list)
    score: float = Field(..., description="취향 적합도 점수 (높을수록 좋음)")
    notes: str | None = None


class RecipeGenerateRequest(BaseModel):
    profile: TasteProfile
    brew_method: BrewMethod
    n_candidates: int = Field(3, ge=1, le=5)


class RecipeGenerateResponse(BaseModel):
    best: Recipe
    alternatives: list[Recipe]
