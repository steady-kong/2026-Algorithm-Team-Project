import random

from app.algorithms.rbt import RedBlackTree


def test_insert_and_search():
    t: RedBlackTree[int, str] = RedBlackTree()
    t.insert(5, "five")
    t.insert(3, "three")
    t.insert(8, "eight")
    assert t.search(5) == "five"
    assert t.search(3) == "three"
    assert t.search(8) == "eight"
    assert t.search(99) is None


def test_insert_duplicate_overwrites_value():
    t: RedBlackTree[int, int] = RedBlackTree()
    t.insert(1, 100)
    t.insert(1, 200)
    assert t.search(1) == 200
    assert len(t) == 1


def test_inorder_is_sorted():
    t: RedBlackTree[int, int] = RedBlackTree()
    keys = [10, 4, 7, 1, 15, 20, 3, 9]
    for k in keys:
        t.insert(k, k)
    inorder_keys = [k for k, _ in t.inorder()]
    assert inorder_keys == sorted(keys)


def test_range_search():
    t: RedBlackTree[int, int] = RedBlackTree()
    for k in [1, 3, 5, 7, 9, 11, 13]:
        t.insert(k, k * 10)
    pairs = list(t.range_search(4, 10))
    assert [k for k, _ in pairs] == [5, 7, 9]
    assert [v for _, v in pairs] == [50, 70, 90]


def test_min_max():
    t: RedBlackTree[int, int] = RedBlackTree()
    assert t.min_key() is None
    assert t.max_key() is None
    for k in [5, 2, 8, 1, 9]:
        t.insert(k, k)
    assert t.min_key() == 1
    assert t.max_key() == 9


def test_random_inserts_match_sorted():
    rng = random.Random(42)
    t: RedBlackTree[int, int] = RedBlackTree()
    keys = list({rng.randint(-1000, 1000) for _ in range(500)})
    rng.shuffle(keys)
    for k in keys:
        t.insert(k, k)
    inorder = [k for k, _ in t.inorder()]
    assert inorder == sorted(keys)
    assert len(t) == len(keys)
