/**
 * UUID v7 — 앞 48비트가 ms 타임스탬프인 시간 정렬 UUID.
 *
 * - 브라우저/Cloudflare Workers 의 `crypto.getRandomValues` 만 사용 (외부 의존성 0).
 * - 출력은 v4 와 동일한 36자 hex-with-dashes 포맷.
 *
 * 사용처:
 *  - 클라이언트가 localStorage 에 저장하는 익명 식별자.
 *  - 매 API 요청의 `X-Client-Id` 헤더로 동봉 → 서버는 정규식으로 v7 형식 검증 후
 *    레이트 리미트 키로 사용.
 */

const HEX = '0123456789abcdef';

function toHex(n: number): string {
	return HEX[(n >> 4) & 0xf] + HEX[n & 0xf];
}

export function uuidV7(): string {
	const bytes = new Uint8Array(16);

	// 0..5 : ms timestamp (big-endian 48 bits)
	let ms = Date.now();
	for (let i = 5; i >= 0; i--) {
		bytes[i] = ms & 0xff;
		ms = Math.floor(ms / 256);
	}

	// 6..15 : 랜덤 (10 bytes)
	crypto.getRandomValues(bytes.subarray(6));

	// 6 번째 바이트 상위 4비트를 version=7 (0111)
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	// 8 번째 바이트 상위 2비트를 variant=10
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	const hex = Array.from(bytes, toHex).join('');
	return (
		hex.slice(0, 8) +
		'-' +
		hex.slice(8, 12) +
		'-' +
		hex.slice(12, 16) +
		'-' +
		hex.slice(16, 20) +
		'-' +
		hex.slice(20)
	);
}

const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isUuidV7(value: unknown): value is string {
	return typeof value === 'string' && UUID_V7_RE.test(value);
}

/** UUID v7 에서 ms 타임스탬프를 추출한다. v7 가 아니면 NaN. */
export function uuidV7Timestamp(uuid: string): number {
	if (!isUuidV7(uuid)) return NaN;
	const hex = uuid.slice(0, 8) + uuid.slice(9, 13);
	return Number.parseInt(hex, 16);
}
