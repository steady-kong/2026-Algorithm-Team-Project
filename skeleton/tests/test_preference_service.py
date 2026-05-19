"""규칙 기반 취향 파싱 폴백 테스트.

LLM 경로는 API 키와 네트워크가 필요하므로, 키 없이도 동작하는 동기 폴백
함수 rule_based_parse 를 직접 검증한다.
"""

from app.services.preference_service import rule_based_parse


def test_high_acidity_and_body():
    profile, rationale = rule_based_parse("바디감 높고 산미 있는 커피")
    assert profile.acidity >= 4
    assert profile.body >= 4
    assert "폴백" in rationale


def test_low_keyword_lowers_score():
    profile, _ = rule_based_parse("산미 없는 부드러운 커피")
    assert profile.acidity <= 2


def test_unmentioned_dimensions_are_neutral():
    profile, _ = rule_based_parse("커피 한 잔 추천해줘")
    assert profile.acidity == 3
    assert profile.body == 3
    assert profile.sweetness == 3
    assert profile.bitterness == 3
    assert profile.roast_level == 3


def test_dark_roast_and_bitterness():
    profile, _ = rule_based_parse("다크 로스트의 강한 쓴맛이 좋아")
    assert profile.roast_level == 5
    assert profile.bitterness >= 4


def test_mild_modifier_is_not_treated_as_low():
    # '약간' 이 '약'(부정 수식어)으로 오분류되지 않아야 한다.
    profile, _ = rule_based_parse("산미가 약간 있으면 좋겠어")
    assert profile.acidity == 3


def test_strong_modifier_pushes_to_extreme():
    profile, _ = rule_based_parse("아주 단맛이 강한 커피")
    assert profile.sweetness == 5
