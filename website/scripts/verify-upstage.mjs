/**
 * Upstage 호출 로직 검증 스크립트 (실제 네트워크 호출 없음).
 *
 * global.fetch 를 가로채 chatJson() 이 만드는 요청 형태를 검사한다:
 *  - 엔드포인트, 메서드, Authorization 헤더, Content-Type
 *  - body 의 model / messages / response_format
 *  - 응답 파싱 (정상 JSON 콘텐츠를 돌려주는지)
 *  - 키 미설정 / 401 / 잘못된 JSON 등 에러 경로
 *
 * 실행: node scripts/verify-upstage.mjs
 */

import { chatJson, NotConfiguredError, LLMResponseError } from '../src/lib/server/upstage.ts';

let passed = 0;
let failed = 0;
function check(name, cond, detail = '') {
	if (cond) {
		console.log(`  ✓ ${name}`);
		passed++;
	} else {
		console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
		failed++;
	}
}

function installMockFetch(makeResponse) {
	const calls = [];
	globalThis.fetch = async (url, init) => {
		const headers = init?.headers ?? {};
		const bodyText = typeof init?.body === 'string' ? init.body : '';
		const body = bodyText ? JSON.parse(bodyText) : null;
		calls.push({ url: String(url), method: init?.method, headers, body });
		return makeResponse({ url, init, body });
	};
	return calls;
}

function jsonResponse(status, payload) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

// ────────────────────────────────────────────────────────────
// 1) 키 없으면 NotConfiguredError
// ────────────────────────────────────────────────────────────
console.log('1) 키 미설정 → NotConfiguredError');
delete process.env.UPSTAGE_API_KEY;
delete process.env.UPSTAGE_MODEL;
let threw;
try {
	await chatJson(undefined, 'sys', 'usr');
} catch (e) {
	threw = e;
}
check('NotConfiguredError throws', threw instanceof NotConfiguredError);

// ────────────────────────────────────────────────────────────
// 2) 정상 호출: 요청 형태 + 응답 파싱
// ────────────────────────────────────────────────────────────
console.log('\n2) 정상 호출 — 요청 형태 검증');
process.env.UPSTAGE_API_KEY = 'sk-test-key-1234';

const calls2 = installMockFetch(() =>
	jsonResponse(200, {
		choices: [{ message: { content: JSON.stringify({ acidity: 4, rationale: '테스트' }) } }]
	})
);
const parsed = await chatJson(undefined, 'system-prompt-here', 'user-prompt-here');

check('한 번 호출됨', calls2.length === 1, `actual=${calls2.length}`);
const c = calls2[0];
check('엔드포인트 = upstage.ai/v1/chat/completions', c.url === 'https://api.upstage.ai/v1/chat/completions', c.url);
check('메서드 = POST', c.method === 'POST');
check('Authorization Bearer sk-test-key-1234', c.headers.authorization === 'Bearer sk-test-key-1234');
check("Content-Type application/json", c.headers['content-type'] === 'application/json');
check('body.model = solar-pro2 (기본)', c.body.model === 'solar-pro2', c.body.model);
check('messages 2개 (system + user)', Array.isArray(c.body.messages) && c.body.messages.length === 2);
check('messages[0].role = system', c.body.messages?.[0]?.role === 'system');
check('messages[0].content 전달됨', c.body.messages?.[0]?.content === 'system-prompt-here');
check('messages[1].role = user', c.body.messages?.[1]?.role === 'user');
check('messages[1].content 전달됨', c.body.messages?.[1]?.content === 'user-prompt-here');
check("response_format = json_object", c.body.response_format?.type === 'json_object');
check('temperature 지정됨 (0.3)', typeof c.body.temperature === 'number');
check('파싱된 JSON 반환', parsed.acidity === 4 && parsed.rationale === '테스트');

// ────────────────────────────────────────────────────────────
// 3) UPSTAGE_MODEL 환경변수로 모델 오버라이드
// ────────────────────────────────────────────────────────────
console.log('\n3) UPSTAGE_MODEL 오버라이드');
process.env.UPSTAGE_MODEL = 'solar-mini';
const calls3 = installMockFetch(() =>
	jsonResponse(200, { choices: [{ message: { content: '{}' } }] })
);
await chatJson(undefined, 's', 'u');
check('UPSTAGE_MODEL 적용됨', calls3[0].body.model === 'solar-mini', calls3[0].body.model);
delete process.env.UPSTAGE_MODEL;

// ────────────────────────────────────────────────────────────
// 4) platform.env 우선
// ────────────────────────────────────────────────────────────
console.log('\n4) platform.env 가 process.env 보다 우선');
const calls4 = installMockFetch(() =>
	jsonResponse(200, { choices: [{ message: { content: '{}' } }] })
);
await chatJson({ env: { UPSTAGE_API_KEY: 'platform-key', UPSTAGE_MODEL: 'solar-pro2' } }, 's', 'u');
check('platform.env 의 키 사용됨', calls4[0].headers.authorization === 'Bearer platform-key');

// ────────────────────────────────────────────────────────────
// 5) HTTP 4xx → LLMResponseError
// ────────────────────────────────────────────────────────────
console.log('\n5) 비정상 응답 처리');
installMockFetch(() => jsonResponse(401, { error: 'invalid_key' }));
let e5;
try {
	await chatJson(undefined, 's', 'u');
} catch (err) {
	e5 = err;
}
check('401 → LLMResponseError', e5 instanceof LLMResponseError && /401/.test(e5.message));

// 6) content 가 JSON 이 아닐 때
installMockFetch(() =>
	jsonResponse(200, { choices: [{ message: { content: '이것은 JSON 이 아님' } }] })
);
let e6;
try {
	await chatJson(undefined, 's', 'u');
} catch (err) {
	e6 = err;
}
check('비-JSON content → LLMResponseError', e6 instanceof LLMResponseError);

// 7) content 가 배열일 때 (JSON object 아님)
installMockFetch(() =>
	jsonResponse(200, { choices: [{ message: { content: '[1,2,3]' } }] })
);
let e7;
try {
	await chatJson(undefined, 's', 'u');
} catch (err) {
	e7 = err;
}
check('JSON 배열 content → LLMResponseError', e7 instanceof LLMResponseError);

// 8) 네트워크 에러 → LLMResponseError
console.log('\n8) 네트워크 에러');
globalThis.fetch = async () => {
	throw new Error('ECONNREFUSED');
};
let e8;
try {
	await chatJson(undefined, 's', 'u');
} catch (err) {
	e8 = err;
}
check('네트워크 에러 → LLMResponseError', e8 instanceof LLMResponseError && /network/.test(e8.message));

// ────────────────────────────────────────────────────────────
console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
