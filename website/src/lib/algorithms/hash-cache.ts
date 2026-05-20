/**
 * 해시 기반 LRU 캐시 — from-scratch.
 *
 * 표준 `Map` 에 의존하지 않고 해시 테이블(분리 연쇄, separate chaining)을 직접 구현한다.
 * sorting.ts 의 mergeSort 와 같은 맥락 — 표준 자료구조를 직접 구현하는 게 과제 취지.
 *
 * - `fnv1a32`: FNV-1a 32비트 문자열 해시. 빠르고 분포가 좋아 캐시 키 해싱에 적합.
 * - `HashCache`: 분리 연쇄 + 용량 상한 + LRU(Least Recently Used) 제거.
 *
 * 운영 환경(Cloudflare Workers)은 요청 간 메모리 지속을 보장하지 않는다
 * (콜드 스타트·다중 isolate). 따라서 이 캐시는 "한 isolate 가 살아있는 동안"의
 * 단기 캐시로만 동작하며, 메모리 누수를 막기 위해 용량을 반드시 제한한다.
 */

/**
 * FNV-1a 32비트 해시. UTF-16 코드 유닛을 하위·상위 바이트로 나눠 섞어
 * 한글 등 BMP 문자의 충돌을 줄인다. 반환값은 부호 없는 32비트 정수.
 */
export function fnv1a32(s: string): number {
	let h = 0x811c9dc5; // FNV offset basis
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		h ^= c & 0xff;
		h = Math.imul(h, 0x01000193); // FNV prime, 32비트 곱
		h ^= (c >> 8) & 0xff;
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

interface Node<V> {
	key: string;
	hash: number;
	value: V;
	tick: number; // 마지막 접근 시각(단조 증가 클럭) — LRU 판단용
}

export interface CacheStats {
	size: number;
	capacity: number;
	hits: number;
	misses: number;
}

export class HashCache<V> {
	private buckets: Node<V>[][];
	private mask: number;
	private size = 0;
	private clock = 0; // 단조 증가 — get/set 마다 +1, 가장 작은 tick 이 LRU 후보
	private hits = 0;
	private misses = 0;

	constructor(private readonly capacity = 256) {
		// 버킷 수는 capacity 이상인 2의 거듭제곱으로 잡아, 모듈로 대신 비트 마스크로 인덱싱.
		let n = 16;
		while (n < capacity) n <<= 1;
		this.buckets = Array.from({ length: n }, () => []);
		this.mask = n - 1;
	}

	get(key: string): V | undefined {
		const hash = fnv1a32(key);
		const bucket = this.buckets[hash & this.mask];
		for (const node of bucket) {
			if (node.hash === hash && node.key === key) {
				node.tick = ++this.clock; // 접근 → 최신으로 갱신
				this.hits++;
				return node.value;
			}
		}
		this.misses++;
		return undefined;
	}

	set(key: string, value: V): void {
		const hash = fnv1a32(key);
		const bucket = this.buckets[hash & this.mask];
		for (const node of bucket) {
			if (node.hash === hash && node.key === key) {
				node.value = value;
				node.tick = ++this.clock;
				return;
			}
		}
		bucket.push({ key, hash, value, tick: ++this.clock });
		this.size++;
		if (this.size > this.capacity) this.evictLRU();
	}

	/**
	 * 전체에서 tick 이 가장 작은(가장 오래 안 쓰인) 노드 1개 제거.
	 * 용량이 작아(기본 256) 전수 스캔 O(n) 으로 충분하다 — O(1) LRU 는
	 * 이중 연결 리스트가 필요해 코드/버그 비용이 더 크다. 규모상 의도적 단순화.
	 */
	private evictLRU(): void {
		let oldestBucket: Node<V>[] | null = null;
		let oldestIdx = -1;
		let oldestTick = Infinity;
		for (const bucket of this.buckets) {
			for (let i = 0; i < bucket.length; i++) {
				if (bucket[i].tick < oldestTick) {
					oldestTick = bucket[i].tick;
					oldestBucket = bucket;
					oldestIdx = i;
				}
			}
		}
		if (oldestBucket && oldestIdx >= 0) {
			oldestBucket.splice(oldestIdx, 1);
			this.size--;
		}
	}

	get stats(): CacheStats {
		return { size: this.size, capacity: this.capacity, hits: this.hits, misses: this.misses };
	}

	clear(): void {
		for (const b of this.buckets) b.length = 0;
		this.size = 0;
	}
}
