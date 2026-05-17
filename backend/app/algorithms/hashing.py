"""개방 주소법(Open Addressing) + 선형 탐사(Linear Probing) 기반 해시 테이블.

Python 내장 dict 를 사용하지 않고 직접 구현. 취향 컨텍스트를 키로 만든 LLM
응답 캐시에 사용된다. tombstone 으로 삭제를 지원한다.
"""

from __future__ import annotations

from typing import Generic, Hashable, Iterator, TypeVar

K = TypeVar("K", bound=Hashable)
V = TypeVar("V")


class _Slot(Generic[K, V]):
    __slots__ = ("key", "value", "deleted")

    def __init__(self, key: K, value: V) -> None:
        self.key: K = key
        self.value: V = value
        self.deleted: bool = False


class HashTable(Generic[K, V]):
    """간단한 해시 테이블. load factor 가 0.7 을 넘으면 자동 리해시."""

    INITIAL_CAPACITY = 16
    MAX_LOAD = 0.7

    def __init__(self) -> None:
        self._cap: int = self.INITIAL_CAPACITY
        self._buckets: list[_Slot[K, V] | None] = [None] * self._cap
        self._size: int = 0  # live entries (tombstone 제외)

    def __len__(self) -> int:
        return self._size

    def _hash(self, key: K, cap: int) -> int:
        # Python built-in hash 는 알고리즘 학습 측면에서 허용. 분포는 충분히 좋다.
        return (hash(key) & 0x7FFFFFFF) % cap

    def _probe(self, key: K) -> int:
        """key 의 자리(빈 슬롯이거나 같은 키를 가진 슬롯)를 찾는다."""
        idx = self._hash(key, self._cap)
        first_tombstone = -1
        for _ in range(self._cap):
            slot = self._buckets[idx]
            if slot is None:
                return first_tombstone if first_tombstone != -1 else idx
            if slot.deleted:
                if first_tombstone == -1:
                    first_tombstone = idx
            elif slot.key == key:
                return idx
            idx = (idx + 1) % self._cap
        # 완전히 가득 찼다면 (드뭄). 호출 전에 리해시되어야 함.
        raise RuntimeError("HashTable is full")

    def put(self, key: K, value: V) -> None:
        if (self._size + 1) / self._cap > self.MAX_LOAD:
            self._rehash(self._cap * 2)
        idx = self._probe(key)
        slot = self._buckets[idx]
        if slot is None or slot.deleted:
            self._buckets[idx] = _Slot(key, value)
            self._size += 1
        else:
            slot.value = value

    def get(self, key: K, default: V | None = None) -> V | None:
        idx = self._hash(key, self._cap)
        for _ in range(self._cap):
            slot = self._buckets[idx]
            if slot is None:
                return default
            if not slot.deleted and slot.key == key:
                return slot.value
            idx = (idx + 1) % self._cap
        return default

    def contains(self, key: K) -> bool:
        return self.get(key, _SENTINEL) is not _SENTINEL  # type: ignore[arg-type]

    def remove(self, key: K) -> bool:
        idx = self._hash(key, self._cap)
        for _ in range(self._cap):
            slot = self._buckets[idx]
            if slot is None:
                return False
            if not slot.deleted and slot.key == key:
                slot.deleted = True
                self._size -= 1
                return True
            idx = (idx + 1) % self._cap
        return False

    def items(self) -> Iterator[tuple[K, V]]:
        for slot in self._buckets:
            if slot is not None and not slot.deleted:
                yield slot.key, slot.value

    def _rehash(self, new_cap: int) -> None:
        old = list(self.items())
        self._cap = new_cap
        self._buckets = [None] * self._cap
        self._size = 0
        for k, v in old:
            self.put(k, v)


_SENTINEL: object = object()
