from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import beans, preference, recipe
from app.config import settings

app = FastAPI(
    title="Coffee Recipe & Bean Optimizer",
    version="0.1.0",
    description="LLM 기반 맞춤형 커피 레시피 추천 및 원두 최적화 시스템",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(preference.router, prefix="/api/preference", tags=["preference"])
app.include_router(recipe.router, prefix="/api/recipe", tags=["recipe"])
app.include_router(beans.router, prefix="/api/beans", tags=["beans"])


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
