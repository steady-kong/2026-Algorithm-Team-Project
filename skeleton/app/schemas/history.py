from pydantic import BaseModel, Field


class HistoryEntry(BaseModel):
    """RBT 에 저장되는 추천 이력 한 건."""

    id: str = Field(..., description="이력 식별자")
    recorded_at: str = Field(..., description="기록 시각 (ISO 8601, UTC)")
    kind: str = Field(..., description="이력 종류: recipe | beans")
    summary: str = Field(..., description="추천 내용 요약")


class HistoryResponse(BaseModel):
    total: int = Field(..., description="저장소에 쌓인 전체 이력 수")
    entries: list[HistoryEntry] = Field(
        default_factory=list, description="최근순으로 정렬된 이력 목록"
    )
