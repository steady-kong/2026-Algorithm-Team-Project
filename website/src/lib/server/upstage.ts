/**
 * Upstage Solar Chat API 클라이언트 (서버 전용).
 *
 * - 키는 Worker secret (UPSTAGE_API_KEY) 으로만 주입. 클라이언트 번들에는 포함되지 않는다.
 * - 모델은 UPSTAGE_MODEL 환경변수로 오버라이드 가능. 기본값: solar-pro2.
 * - 응답을 JSON 으로 강제하고, 실패 시 NotConfiguredError 또는 LLMResponseError 를 던진다.
 */

const ENDPOINT = 'https://api.upstage.ai/v1/chat/completions';
const DEFAULT_MODEL = 'solar-pro2';

export class NotConfiguredError extends Error {}
export class LLMResponseError extends Error {}

interface PlatformEnv {
	UPSTAGE_API_KEY?: string;
	UPSTAGE_MODEL?: string;
}

function readEnv(platform: App.Platform | undefined): PlatformEnv {
	const env: PlatformEnv = {};
	const pEnv = platform?.env as Record<string, unknown> | undefined;
	if (pEnv && typeof pEnv === 'object') {
		if (typeof pEnv.UPSTAGE_API_KEY === 'string') env.UPSTAGE_API_KEY = pEnv.UPSTAGE_API_KEY;
		if (typeof pEnv.UPSTAGE_MODEL === 'string') env.UPSTAGE_MODEL = pEnv.UPSTAGE_MODEL;
	}
	// 로컬 개발 (`vite dev`) 에서는 process.env 도 확인.
	const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
	if (proc?.env) {
		if (!env.UPSTAGE_API_KEY && proc.env.UPSTAGE_API_KEY) env.UPSTAGE_API_KEY = proc.env.UPSTAGE_API_KEY;
		if (!env.UPSTAGE_MODEL && proc.env.UPSTAGE_MODEL) env.UPSTAGE_MODEL = proc.env.UPSTAGE_MODEL;
	}
	return env;
}

export async function chatJson(
	platform: App.Platform | undefined,
	systemPrompt: string,
	userPrompt: string,
	opts: { timeoutMs?: number } = {}
): Promise<Record<string, unknown>> {
	const env = readEnv(platform);
	if (!env.UPSTAGE_API_KEY) {
		throw new NotConfiguredError('UPSTAGE_API_KEY not configured');
	}
	const model = env.UPSTAGE_MODEL ?? DEFAULT_MODEL;
	const timeoutMs = opts.timeoutMs ?? 12_000;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	let resp: Response;
	try {
		resp = await fetch(ENDPOINT, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${env.UPSTAGE_API_KEY}`
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				response_format: { type: 'json_object' },
				temperature: 0.3
			}),
			signal: controller.signal
		});
	} catch (e) {
		throw new LLMResponseError(`network error: ${(e as Error).message}`);
	} finally {
		clearTimeout(timer);
	}

	if (!resp.ok) {
		throw new LLMResponseError(`upstage returned ${resp.status}`);
	}
	const data = (await resp.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const content = data.choices?.[0]?.message?.content;
	if (typeof content !== 'string') {
		throw new LLMResponseError('no content in response');
	}
	try {
		const parsed = JSON.parse(content);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new LLMResponseError('content is not a JSON object');
		}
		return parsed as Record<string, unknown>;
	} catch (e) {
		if (e instanceof LLMResponseError) throw e;
		throw new LLMResponseError(`invalid JSON content: ${(e as Error).message}`);
	}
}
