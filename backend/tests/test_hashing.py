from app.algorithms.hashing import HashTable


def test_put_get_basic():
    h: HashTable[str, int] = HashTable()
    h.put("a", 1)
    h.put("b", 2)
    assert h.get("a") == 1
    assert h.get("b") == 2
    assert h.get("missing") is None
    assert len(h) == 2


def test_put_overwrites():
    h: HashTable[str, int] = HashTable()
    h.put("a", 1)
    h.put("a", 99)
    assert h.get("a") == 99
    assert len(h) == 1


def test_remove_and_reinsert():
    h: HashTable[str, int] = HashTable()
    h.put("x", 10)
    assert h.remove("x") is True
    assert h.get("x") is None
    assert h.remove("x") is False
    h.put("x", 20)
    assert h.get("x") == 20


def test_rehash_when_full():
    h: HashTable[int, int] = HashTable()
    n = 200
    for i in range(n):
        h.put(i, i * 2)
    for i in range(n):
        assert h.get(i) == i * 2
    assert len(h) == n


def test_tombstone_does_not_break_probe():
    h: HashTable[str, int] = HashTable()
    # 충돌을 강제하지 않더라도 일반적 시나리오에서 작동해야 한다.
    keys = [f"k{i}" for i in range(50)]
    for i, k in enumerate(keys):
        h.put(k, i)
    for k in keys[::2]:
        h.remove(k)
    for i, k in enumerate(keys):
        if i % 2 == 0:
            assert h.get(k) is None
        else:
            assert h.get(k) == i
