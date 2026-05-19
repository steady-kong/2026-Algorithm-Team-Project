"""정렬 알고리즘 from-scratch 구현.

레시피 후보 정렬에 사용된다. 표준 라이브러리의 `sorted` / `list.sort` 를
사용하지 않고, 머지 소트와 퀵 소트를 직접 구현한다.

- merge_sort: 안정 정렬, O(n log n) 보장. 레시피처럼 동률(점수 같은 경우)이
  생겼을 때 원래 순서를 유지하고 싶을 때 사용.
- quick_sort: 평균 O(n log n), 메모리 적게 사용. 보조 비교용으로 함께 제공.
"""

from __future__ import annotations

from typing import Callable, TypeVar

T = TypeVar("T")


def merge_sort(
    items: list[T],
    key: Callable[[T], float] | None = None,
    reverse: bool = False,
) -> list[T]:
    """안정적인 머지 소트. 새 리스트를 반환한다."""
    if len(items) <= 1:
        return list(items)

    keyfn: Callable[[T], float] = key if key is not None else (lambda x: x)  # type: ignore[assignment, return-value]
    arr = list(items)
    _merge_sort_inplace(arr, 0, len(arr), keyfn, reverse)
    return arr


def _merge_sort_inplace(
    arr: list[T],
    lo: int,
    hi: int,
    keyfn: Callable[[T], float],
    reverse: bool,
) -> None:
    if hi - lo <= 1:
        return
    mid = (lo + hi) // 2
    _merge_sort_inplace(arr, lo, mid, keyfn, reverse)
    _merge_sort_inplace(arr, mid, hi, keyfn, reverse)
    _merge(arr, lo, mid, hi, keyfn, reverse)


def _merge(
    arr: list[T],
    lo: int,
    mid: int,
    hi: int,
    keyfn: Callable[[T], float],
    reverse: bool,
) -> None:
    left = arr[lo:mid]
    right = arr[mid:hi]
    i = j = 0
    k = lo
    while i < len(left) and j < len(right):
        lk = keyfn(left[i])
        rk = keyfn(right[j])
        take_left = lk > rk if reverse else lk <= rk
        if take_left:
            arr[k] = left[i]
            i += 1
        else:
            arr[k] = right[j]
            j += 1
        k += 1
    while i < len(left):
        arr[k] = left[i]
        i += 1
        k += 1
    while j < len(right):
        arr[k] = right[j]
        j += 1
        k += 1


def quick_sort(
    items: list[T],
    key: Callable[[T], float] | None = None,
    reverse: bool = False,
) -> list[T]:
    """Lomuto 파티션 기반 in-place 퀵 소트. 새 리스트를 반환한다."""
    keyfn: Callable[[T], float] = key if key is not None else (lambda x: x)  # type: ignore[assignment, return-value]
    arr = list(items)
    _quick_sort_inplace(arr, 0, len(arr) - 1, keyfn, reverse)
    return arr


def _quick_sort_inplace(
    arr: list[T],
    lo: int,
    hi: int,
    keyfn: Callable[[T], float],
    reverse: bool,
) -> None:
    if lo >= hi:
        return
    p = _partition(arr, lo, hi, keyfn, reverse)
    _quick_sort_inplace(arr, lo, p - 1, keyfn, reverse)
    _quick_sort_inplace(arr, p + 1, hi, keyfn, reverse)


def _partition(
    arr: list[T],
    lo: int,
    hi: int,
    keyfn: Callable[[T], float],
    reverse: bool,
) -> int:
    pivot = keyfn(arr[hi])
    i = lo - 1
    for j in range(lo, hi):
        kj = keyfn(arr[j])
        cond = kj > pivot if reverse else kj <= pivot
        if cond:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[hi] = arr[hi], arr[i + 1]
    return i + 1
