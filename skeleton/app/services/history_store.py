"""추천 이력 저장소.

레시피·원두 추천이 일어날 때마다 그 시각을 키로 직접 구현한 Red-Black Tree
에 기록한다. RBT 가 정렬 상태를 유지하므로 최근 이력 조회와 기간 조회를
O(log n) 삽입 + 정렬된 순회로 처리할 수 있다.

저장은 프로세스 메모리에만 한다(DB 없음). 서버를 재시작하면 이력은 사라진다.
학습용 프로젝트 범위에서 RBT 의 활용을 보이기 위한 구성이다.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

from app.algorithms.rbt import RedBlackTree
from app.schemas.history import HistoryEntry

# RBT 키는 (기록 시각 ns, 일련번호) 튜플이다. 일련번호 덕분에 같은 나노초에
# 두 건이 들어와도 키가 겹치지 않는다. 튜플은 사전식으로 비교되므로 시간순
# 정렬이 그대로 보장된다.
_HistoryKey = tuple[int, int]


class HistoryStore:
    def __init__(self) -> None:
        self._tree: RedBlackTree[_HistoryKey, HistoryEntry] = RedBlackTree()
        self._seq: int = 0

    def __len__(self) -> int:
        return len(self._tree)

    def record(self, kind: str, summary: str) -> HistoryEntry:
        """추천 이력 한 건을 기록하고 그 엔트리를 반환한다."""
        self._seq += 1
        now = datetime.now(timezone.utc)
        entry = HistoryEntry(
            id=f"h{self._seq:06d}",
            recorded_at=now.isoformat(),
            kind=kind,
            summary=summary,
        )
        self._tree.insert((time.time_ns(), self._seq), entry)
        return entry

    def recent(self, limit: int) -> list[HistoryEntry]:
        """가장 최근 이력을 limit 개, 최신순으로 반환한다."""
        ascending = [entry for _, entry in self._tree.inorder()]
        return list(reversed(ascending[-limit:]))

    def range(
        self,
        since: datetime | None,
        until: datetime | None,
        limit: int,
    ) -> list[HistoryEntry]:
        """[since, until] 구간의 이력을 최신순으로 limit 개 반환한다.

        RBT 의 범위 질의(range_search)를 사용한다.
        """
        lo: _HistoryKey = (
            int(since.timestamp() * 1_000_000_000) if since else 0,
            0,
        )
        hi: _HistoryKey = (
            int(until.timestamp() * 1_000_000_000) if until else (1 << 63) - 1,
            (1 << 63) - 1,
        )
        ascending = [entry for _, entry in self._tree.range_search(lo, hi)]
        return list(reversed(ascending[-limit:]))


# 프로세스 전역 단일 인스턴스.
history_store = HistoryStore()
