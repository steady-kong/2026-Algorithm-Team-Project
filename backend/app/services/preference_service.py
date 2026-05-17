"""취향 파싱 서비스.

자유 텍스트를 1~5 척도의 :class:`TasteProfile` 로 변환한다.

- Upstage API 키가 설정되어 있으면 LLM 으로 분석한다.
- 키가 없거나 LLM 응답이 비정상이면 키워드 기반 규칙 폴백으로 처리한다.

폴백 덕분에 API 키 없이도 전체 추천 파이프라인을 검증할 수 있다. 규칙 폴백은
정교한 자연어 이해가 아니라, 차원별 한국어 키워드와 그 주변의 강도 수식어를
훑어 점수를 추정하는 휴리스틱이다.
"""

from __future__ import annotations

import httpx

from app.schemas.preference import (
    PreferenceParseRequest,
    PreferenceParseResponse,
    TasteProfile,
)
from app.services.llm_client import LLMResponseError, NotConfiguredError, llm_client

# --------------------------------------------------------------------------
# 규칙 기반 폴백
# --------------------------------------------------------------------------

# 산미/바디/단맛/쓴맛 차원별 한국어 키워드.
_DIM_KEYWORDS: dict[str, tuple[str, ...]] = {
    "acidity": ("산미", "신맛", "산뜻", "상큼", "새콤", "프루티", "과일향", "과일"),
    "body": ("바디", "묵직", "무게감", "진득", "걸쭉", "두께감"),
    "sweetness": ("단맛", "달콤", "달달", "스위트", "당도"),
    "bitterness": ("쓴맛", "쌉쌀", "쓰게", "씁쓸"),
}

# 키워드 주변 윈도에서 찾는 강도 수식어. 평가 우선순위는 아래 _infer_level 참고.
_LOW_STRONG = ("전혀", "하나도")
_MILD = ("약간", "살짝", "조금", "적당", "중간", "보통")
_LOW = ("낮", "약", "적", "없", "연하", "부드럽", "싫", "별로", "덜", "빼", "은은")
_HIGH_STRONG = ("매우", "아주", "엄청", "굉장", "완전", "최고", "제일", "많이", "강하게")
_HIGH = ("높", "강", "진하", "풍부", "가득", "듬뿍", "좋", "있", "원하", "선호", "뚜렷", "확실")

# 로스팅은 키워드 자체가 단계를 직접 가리키므로 따로 매핑한다. (앞쪽 우선 매칭)
_ROAST_KEYWORDS: tuple[tuple[tuple[str, ...], int], ...] = (
    (("강배전", "다크 로스트", "다크로스트", "프렌치 로스트", "다크"), 5),
    (("중강배전", "풀시티", "풀 시티"), 4),
    (("중배전", "미디엄", "시티 로스트", "시티로스트"), 3),
    (("중약배전", "하이 로스트"), 2),
    (("약배전", "라이트 로스트", "라이트로스트", "라이트", "시나몬 로스트"), 1),
)

_WINDOW = 12  # 키워드 앞뒤로 살펴볼 글자 수

_LEVEL_LABEL = {1: "매우 약함", 2: "약함", 3: "보통", 4: "강함", 5: "매우 강함"}


def _infer_level(window: str) -> int:
    """키워드 주변 텍스트에서 선호 강도(1~5)를 추정한다.

    우선순위: 강한 부정 > 완화(약간/적당) > 부정 > 강한 긍정 > 긍정 > 기본.
    '약간'(_MILD)을 '약'(_LOW)보다 먼저 검사해 '약간'이 부정으로 잘못 분류되는
    것을 막는다.
    """
    if any(w in window for w in _LOW_STRONG):
        return 1
    if any(w in window for w in _MILD):
        return 3
    if any(w in window for w in _LOW):
        return 2
    if any(w in window for w in _HIGH_STRONG):
        return 5
    if any(w in window for w in _HIGH):
        return 4
    # 수식어 없이 차원만 언급 → 해당 맛을 원한다는 의미로 본다.
    return 4


def _detect_dimension(text: str, keywords: tuple[str, ...]) -> int | None:
    """차원 키워드가 등장한 모든 위치의 추정 강도를 평균낸다. 없으면 None."""
    levels: list[int] = []
    for kw in keywords:
        start = 0
        while True:
            idx = text.find(kw, start)
            if idx == -1:
                break
            window = text[max(0, idx - _WINDOW) : idx + len(kw) + _WINDOW]
            levels.append(_infer_level(window))
            start = idx + len(kw)
    if not levels:
        return None
    return max(1, min(5, round(sum(levels) / len(levels))))


def _detect_roast(text: str) -> int | None:
    """로스팅 단계를 추정한다. 직접 키워드 우선, 없으면 '로스팅' 주변 강도."""
    for keywords, level in _ROAST_KEYWORDS:
        for kw in keywords:
            if kw in text:
                return level
    for kw in ("로스팅", "배전", "로스트"):
        idx = text.find(kw)
        if idx != -1:
            window = text[max(0, idx - _WINDOW) : idx + len(kw) + _WINDOW]
            return _infer_level(window)
    return None


def rule_based_parse(text: str) -> tuple[TasteProfile, str]:
    """키워드 휴리스틱으로 취향 프로파일을 추정한다. (LLM 미사용, 동기 함수)

    언급되지 않은 차원은 중립값 3 으로 둔다. 반환되는 rationale 에는 어떤 차원이
    어떻게 추정됐는지와, 규칙 기반 폴백이 사용됐다는 사실을 적는다.
    """
    detected: dict[str, int] = {}
    for dim, keywords in _DIM_KEYWORDS.items():
        level = _detect_dimension(text, keywords)
        if level is not None:
            detected[dim] = level

    roast = _detect_roast(text)
    if roast is not None:
        detected["roast_level"] = roast

    profile = TasteProfile(
        acidity=detected.get("acidity", 3),
        body=detected.get("body", 3),
        sweetness=detected.get("sweetness", 3),
        bitterness=detected.get("bitterness", 3),
        roast_level=detected.get("roast_level", 3),
    )

    dim_ko = {
        "acidity": "산미",
        "body": "바디감",
        "sweetness": "단맛",
        "bitterness": "쓴맛",
        "roast_level": "로스팅",
    }
    if detected:
        parts = [
            f"{dim_ko[d]} {_LEVEL_LABEL[v]}({v})" for d, v in detected.items()
        ]
        found = ", ".join(parts)
    else:
        found = "뚜렷한 취향 키워드를 찾지 못함"
    rationale = (
        f"키워드 기반 추정 — {found}. 언급되지 않은 항목은 중립(3)으로 설정. "
        "(Upstage API 키 미설정 → 규칙 기반 폴백)"
    )
    return profile, rationale


# --------------------------------------------------------------------------
# LLM 경로
# --------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "너는 커피 취향 분석기다. 사용자가 자유롭게 쓴 한국어 문장을 읽고, 원하는 "
    "커피의 맛을 1~5 정수 척도로 평가해 JSON 으로만 답하라. 키는 정확히 다음과 "
    "같다: acidity(산미), body(바디감), sweetness(단맛), bitterness(쓴맛), "
    "roast_level(선호 로스팅, 1=라이트 ~ 5=다크), rationale(점수를 그렇게 매긴 "
    "이유를 한국어 한두 문장으로). 언급되지 않은 항목은 3 으로 둔다."
)


def _clamp_level(value: object) -> int:
    """LLM 이 돌려준 값을 1~5 정수로 강제 변환한다."""
    try:
        n = int(round(float(value)))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 3
    return max(1, min(5, n))


async def parse_preference(req: PreferenceParseRequest) -> PreferenceParseResponse:
    """취향 텍스트를 구조화된 프로파일로 변환한다.

    LLM 호출에 실패하면(키 미설정 포함) 규칙 기반 폴백으로 자동 전환한다.
    """
    try:
        data = await llm_client.chat_json(_SYSTEM_PROMPT, req.text)
        profile = TasteProfile(
            acidity=_clamp_level(data.get("acidity", 3)),
            body=_clamp_level(data.get("body", 3)),
            sweetness=_clamp_level(data.get("sweetness", 3)),
            bitterness=_clamp_level(data.get("bitterness", 3)),
            roast_level=_clamp_level(data.get("roast_level", 3)),
        )
        rationale = str(data.get("rationale", "")).strip() or "LLM 분석 결과"
        return PreferenceParseResponse(
            profile=profile, rationale=f"{rationale} (Upstage LLM 분석)"
        )
    except (NotConfiguredError, LLMResponseError, httpx.HTTPError, KeyError, ValueError, TypeError):
        profile, rationale = rule_based_parse(req.text)
        return PreferenceParseResponse(profile=profile, rationale=rationale)
