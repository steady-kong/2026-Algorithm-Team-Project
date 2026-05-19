import random

from app.algorithms.sorting import merge_sort, quick_sort


def test_merge_sort_basic_asc():
    assert merge_sort([3, 1, 4, 1, 5, 9, 2, 6]) == [1, 1, 2, 3, 4, 5, 6, 9]


def test_merge_sort_basic_desc():
    assert merge_sort([3, 1, 4, 1, 5], reverse=True) == [5, 4, 3, 1, 1]


def test_merge_sort_empty_and_singleton():
    assert merge_sort([]) == []
    assert merge_sort([42]) == [42]


def test_merge_sort_with_key_object():
    items = [{"s": 0.5}, {"s": 0.9}, {"s": 0.1}]
    sorted_items = merge_sort(items, key=lambda x: x["s"], reverse=True)
    assert [x["s"] for x in sorted_items] == [0.9, 0.5, 0.1]


def test_merge_sort_is_stable():
    # 동일 key 입력 순서가 보존되어야 한다
    items = [("a", 1), ("b", 1), ("c", 1)]
    out = merge_sort(items, key=lambda x: x[1])
    assert [x[0] for x in out] == ["a", "b", "c"]


def test_quick_sort_random_matches_python_sorted():
    rng = random.Random(0)
    for _ in range(20):
        n = rng.randint(0, 50)
        data = [rng.randint(-100, 100) for _ in range(n)]
        assert quick_sort(data) == sorted(data)
