"""API 엔드포인트 통합 테스트 (FastAPI TestClient).

API 키 없이 실행되므로 LLM 의존 엔드포인트는 규칙 기반 폴백 경로를 탄다.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_PROFILE = {
    "acidity": 3,
    "body": 3,
    "sweetness": 3,
    "bitterness": 3,
    "roast_level": 3,
}


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_preference_parse():
    resp = client.post(
        "/api/preference/parse",
        json={"text": "산미가 강한 커피", "brew_method": "hand_drip"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["profile"]["acidity"] >= 4
    assert isinstance(body["rationale"], str)


def test_preference_parse_rejects_empty_text():
    resp = client.post(
        "/api/preference/parse",
        json={"text": "", "brew_method": "hand_drip"},
    )
    assert resp.status_code == 422


def test_recipe_generate():
    resp = client.post(
        "/api/recipe/generate",
        json={"profile": _PROFILE, "brew_method": "hand_drip", "n_candidates": 3},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "best" in body
    assert body["best"]["score"] >= max(
        (alt["score"] for alt in body["alternatives"]), default=0.0
    )


def test_beans_recommend():
    resp = client.post(
        "/api/beans/recommend",
        json={"profile": _PROFILE, "top_k": 3, "min_match_score": 0.0},
    )
    assert resp.status_code == 200
    assert len(resp.json()["recommendations"]) <= 3


def test_recipe_history_grows_after_generate():
    client.post(
        "/api/recipe/generate",
        json={"profile": _PROFILE, "brew_method": "moka_pot", "n_candidates": 2},
    )
    resp = client.get("/api/recipe/history", params={"limit": 5})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    assert len(body["entries"]) <= 5
