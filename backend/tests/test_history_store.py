"""추천 이력 저장소(RBT 기반) 테스트.

전역 history_store 오염을 피하려고 각 테스트마다 새 HistoryStore 를 만든다.
"""

from datetime import datetime, timedelta, timezone

from app.services.history_store import HistoryStore


def test_record_increases_length():
    store = HistoryStore()
    store.record("recipe", "첫 추천")
    store.record("beans", "두 번째 추천")
    assert len(store) == 2


def test_recent_returns_newest_first():
    store = HistoryStore()
    for i in range(5):
        store.record("recipe", f"r{i}")
    recent = store.recent(3)
    assert [e.summary for e in recent] == ["r4", "r3", "r2"]


def test_recent_limit_larger_than_size():
    store = HistoryStore()
    store.record("recipe", "only")
    assert len(store.recent(100)) == 1


def test_range_search_includes_in_window():
    store = HistoryStore()
    store.record("recipe", "지금 추천")
    now = datetime.now(timezone.utc)
    inside = store.range(now - timedelta(hours=1), now + timedelta(hours=1), 10)
    assert len(inside) == 1


def test_range_search_excludes_outside_window():
    store = HistoryStore()
    store.record("recipe", "지금 추천")
    now = datetime.now(timezone.utc)
    past = store.range(now - timedelta(hours=2), now - timedelta(hours=1), 10)
    assert past == []


def test_entry_fields_are_populated():
    store = HistoryStore()
    entry = store.record("beans", "원두 추천 3건")
    assert entry.id == "h000001"
    assert entry.kind == "beans"
    assert entry.summary == "원두 추천 3건"
    # recorded_at 은 파싱 가능한 ISO 8601 문자열이어야 한다.
    assert datetime.fromisoformat(entry.recorded_at)
