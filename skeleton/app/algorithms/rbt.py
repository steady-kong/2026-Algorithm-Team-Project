"""Red-Black Tree from-scratch 구현.

CLRS 표준 알고리즘을 따른다. 정렬 상태를 유지하면서 O(log n) 삽입·검색·범위
질의를 제공한다. 사용자 추천 이력(timestamp 키)을 저장하는 데 사용된다.

지원 연산:
- insert(key, value): 동일 키가 있으면 value 만 덮어쓴다.
- search(key): 매칭되는 value 또는 None.
- min_key / max_key
- inorder(): 키 오름차순으로 (key, value) 를 yield.
- range_search(lo, hi): lo <= key <= hi 인 (key, value) 를 키 오름차순으로 yield.
"""

from __future__ import annotations

from typing import Any, Generic, Iterator, TypeVar

K = TypeVar("K")
V = TypeVar("V")

RED = True
BLACK = False


class _Node(Generic[K, V]):
    __slots__ = ("key", "value", "color", "left", "right", "parent")

    def __init__(self, key: K, value: V, color: bool = RED) -> None:
        self.key: K = key
        self.value: V = value
        self.color: bool = color
        self.left: _Node[K, V] = _NIL  # type: ignore[assignment]
        self.right: _Node[K, V] = _NIL  # type: ignore[assignment]
        self.parent: _Node[K, V] = _NIL  # type: ignore[assignment]


# Sentinel NIL — black, self-referencing. CLRS 관례.
_NIL: _Node[Any, Any] = _Node.__new__(_Node)
_NIL.key = None  # type: ignore[assignment]
_NIL.value = None  # type: ignore[assignment]
_NIL.color = BLACK
_NIL.left = _NIL
_NIL.right = _NIL
_NIL.parent = _NIL


class RedBlackTree(Generic[K, V]):
    def __init__(self) -> None:
        self._root: _Node[K, V] = _NIL  # type: ignore[assignment]
        self._size: int = 0

    def __len__(self) -> int:
        return self._size

    # ---------- 외부 API ----------

    def insert(self, key: K, value: V) -> None:
        existing = self._find(key)
        if existing is not _NIL:
            existing.value = value
            return

        z = _Node(key, value, color=RED)
        z.left = _NIL
        z.right = _NIL

        y: _Node[K, V] = _NIL  # type: ignore[assignment]
        x: _Node[K, V] = self._root
        while x is not _NIL:
            y = x
            x = x.left if key < x.key else x.right  # type: ignore[operator]
        z.parent = y
        if y is _NIL:
            self._root = z
        elif key < y.key:  # type: ignore[operator]
            y.left = z
        else:
            y.right = z

        self._size += 1
        self._insert_fixup(z)

    def search(self, key: K) -> V | None:
        node = self._find(key)
        return None if node is _NIL else node.value

    def contains(self, key: K) -> bool:
        return self._find(key) is not _NIL

    def min_key(self) -> K | None:
        if self._root is _NIL:
            return None
        return self._min(self._root).key

    def max_key(self) -> K | None:
        if self._root is _NIL:
            return None
        node = self._root
        while node.right is not _NIL:
            node = node.right
        return node.key

    def inorder(self) -> Iterator[tuple[K, V]]:
        yield from self._inorder(self._root)

    def range_search(self, lo: K, hi: K) -> Iterator[tuple[K, V]]:
        yield from self._range(self._root, lo, hi)

    # ---------- 내부 ----------

    def _find(self, key: K) -> _Node[K, V]:
        x = self._root
        while x is not _NIL and key != x.key:
            x = x.left if key < x.key else x.right  # type: ignore[operator]
        return x

    def _min(self, node: _Node[K, V]) -> _Node[K, V]:
        while node.left is not _NIL:
            node = node.left
        return node

    def _left_rotate(self, x: _Node[K, V]) -> None:
        y = x.right
        x.right = y.left
        if y.left is not _NIL:
            y.left.parent = x
        y.parent = x.parent
        if x.parent is _NIL:
            self._root = y
        elif x is x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    def _right_rotate(self, x: _Node[K, V]) -> None:
        y = x.left
        x.left = y.right
        if y.right is not _NIL:
            y.right.parent = x
        y.parent = x.parent
        if x.parent is _NIL:
            self._root = y
        elif x is x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    def _insert_fixup(self, z: _Node[K, V]) -> None:
        while z.parent.color == RED:
            if z.parent is z.parent.parent.left:
                y = z.parent.parent.right
                if y.color == RED:
                    z.parent.color = BLACK
                    y.color = BLACK
                    z.parent.parent.color = RED
                    z = z.parent.parent
                else:
                    if z is z.parent.right:
                        z = z.parent
                        self._left_rotate(z)
                    z.parent.color = BLACK
                    z.parent.parent.color = RED
                    self._right_rotate(z.parent.parent)
            else:
                y = z.parent.parent.left
                if y.color == RED:
                    z.parent.color = BLACK
                    y.color = BLACK
                    z.parent.parent.color = RED
                    z = z.parent.parent
                else:
                    if z is z.parent.left:
                        z = z.parent
                        self._right_rotate(z)
                    z.parent.color = BLACK
                    z.parent.parent.color = RED
                    self._left_rotate(z.parent.parent)
        self._root.color = BLACK

    def _inorder(self, node: _Node[K, V]) -> Iterator[tuple[K, V]]:
        if node is _NIL:
            return
        yield from self._inorder(node.left)
        yield node.key, node.value
        yield from self._inorder(node.right)

    def _range(
        self, node: _Node[K, V], lo: K, hi: K
    ) -> Iterator[tuple[K, V]]:
        if node is _NIL:
            return
        if lo < node.key:  # type: ignore[operator]
            yield from self._range(node.left, lo, hi)
        if lo <= node.key <= hi:  # type: ignore[operator]
            yield node.key, node.value
        if node.key < hi:  # type: ignore[operator]
            yield from self._range(node.right, lo, hi)
