/**
 * Upstage Solar Chat API 클라이언트 (서버 전용).
 *
 * - 키는 Worker secret (UPSTAGE_API_KEY) 으로만 주입. 클라이언트 번들에는 포함되지 않는다.
 * - 모델은 UPSTAGE_MODEL 환경변수로 오버라이드 가능. 기본값: solar-pro3.
 * - 응답을 JSON 으로 강제하고, 실패 시 NotConfiguredError 또는 LLMResponseError 를 던진다.
 */

const ENDPOINT = 'https://api.upstage.ai/v1/chat/completions';
// 기본 solar-pro3 — 함수 호출(agentic) 루프에서 pro2 보다 한 번에 정확하고 content 군더더기가
// 적어 안정적(plan.md §47/§51). UPSTAGE_MODEL 로 오버라이드 가능.
const DEFAULT_MODEL = 'solar-pro3';

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
	opts: { timeoutMs?: number; temperature?: number } = {}
): Promise<Record<string, unknown>> {
	const env = readEnv(platform);
	if (!env.UPSTAGE_API_KEY) {
		throw new NotConfiguredError('UPSTAGE_API_KEY not configured');
	}
	const model = env.UPSTAGE_MODEL ?? DEFAULT_MODEL;
	const timeoutMs = opts.timeoutMs ?? 12_000;
	const temperature = opts.temperature ?? 0.3;
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
				temperature
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

// ────────────────────────────────────────────────────────────
// 함수 호출(tool use) 멀티스텝 루프 — plan.md §50.
//
// LLM 이 "어떤 도구를 어떤 인자로 부를지" 만 정하고, 실제 계산/생성 처리는
// 도구 핸들러(tools.ts)가 한다. OpenAI 완전 호환(tools[]/tool_choice/tool_calls/
// role:"tool"). 종결형 도구(terminal)가 호출되면 그 인자를 회수하고 루프를 끝낸다.
// chatJson(single-shot)은 그대로 보존 — 키 없음/루프 실패 시 폴백 경로로 강하.
// ────────────────────────────────────────────────────────────

/** 함수 호출 도구 정의. schema 는 OpenAI tools[] 한 항목, handler 는 인자를 받아 결과를 돌려준다. */
export interface ToolDef {
	schema: {
		type: 'function';
		function: {
			name: string;
			description: string;
			parameters: Record<string, unknown>;
		};
	};
	/** 인자를 받아 결과(JSON 직렬화 가능 값)를 돌려준다. 종결형이면 호출 자체로 루프가 끝난다. */
	handler: (args: Record<string, unknown>) => unknown | Promise<unknown>;
	/** true 면 이 도구 호출 시 루프를 종료하고 인자를 회수한다 (present_* 같은 제출형). */
	terminal?: boolean;
}

export interface ToolLoopResult {
	/** 종결 도구가 호출됐다면 그 이름, 아니면 null. */
	terminalName: string | null;
	/** 종결 도구의 (검증 전) 인자. */
	terminalArgs: Record<string, unknown> | null;
	/** 종결 도구 없이 모델이 일반 텍스트로 끝났을 때의 본문. */
	finalText: string | null;
	/** 소비한 스텝 수 (디버깅용). */
	steps: number;
}

interface ToolCall {
	id?: string;
	type?: string;
	function?: { name?: string; arguments?: string };
}

interface AssistantMessage {
	role: 'assistant';
	content: string | null;
	tool_calls?: ToolCall[];
}

function parseArgs(raw: string | undefined): Record<string, unknown> {
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	} catch {
		return {};
	}
}

/**
 * 함수 호출 멀티스텝 루프를 돈다.
 *  1) system + user + tools[] 전송
 *  2) 모델이 tool_calls 반환 → 각 핸들러 실행
 *     - 종결형이면 인자 회수 후 종료
 *     - 아니면 결과를 role:"tool" 로 되먹이고 다시 호출
 *  3) tool_calls 없이 텍스트로 끝나면 finalText 반환
 * 총예산 타임아웃(timeoutMs) + maxSteps 로 무한 루프/지연 방지.
 */
export async function chatWithTools(
	platform: App.Platform | undefined,
	systemPrompt: string,
	userPrompt: string,
	tools: Record<string, ToolDef>,
	opts: { timeoutMs?: number; maxSteps?: number } = {}
): Promise<ToolLoopResult> {
	const env = readEnv(platform);
	if (!env.UPSTAGE_API_KEY) {
		throw new NotConfiguredError('UPSTAGE_API_KEY not configured');
	}
	const model = env.UPSTAGE_MODEL ?? DEFAULT_MODEL;
	const maxSteps = opts.maxSteps ?? 5;
	const deadline = Date.now() + (opts.timeoutMs ?? 22_000);

	const toolSchemas = Object.values(tools).map((t) => t.schema);
	const messages: Array<Record<string, unknown>> = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	];

	for (let step = 0; step < maxSteps; step++) {
		const remaining = deadline - Date.now();
		if (remaining <= 0) {
			throw new LLMResponseError('tool loop budget exhausted');
		}
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), remaining);

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
					messages,
					tools: toolSchemas,
					tool_choice: 'auto',
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
			choices?: Array<{ message?: AssistantMessage }>;
		};
		const msg = data.choices?.[0]?.message;
		const toolCalls = Array.isArray(msg?.tool_calls) ? msg!.tool_calls : [];

		// tool_calls 가 없으면 모델이 일반 텍스트로 종료한 것.
		if (toolCalls.length === 0) {
			return {
				terminalName: null,
				terminalArgs: null,
				finalText: typeof msg?.content === 'string' ? msg.content : null,
				steps: step + 1
			};
		}

		// assistant 의 tool_calls 메시지를 먼저 그대로 적재 (OpenAI 규약).
		messages.push({
			role: 'assistant',
			content: msg?.content ?? null,
			tool_calls: toolCalls
		});

		for (const call of toolCalls) {
			const name = call.function?.name ?? '';
			const def = tools[name];
			const args = parseArgs(call.function?.arguments);

			// 종결 도구 — 인자를 회수하고 루프 종료.
			if (def?.terminal) {
				return {
					terminalName: name,
					terminalArgs: args,
					finalText: typeof msg?.content === 'string' ? msg.content : null,
					steps: step + 1
				};
			}

			// 일반 도구 — 핸들러 실행 후 결과를 role:"tool" 로 되먹임.
			let result: unknown;
			try {
				result = def ? await def.handler(args) : { error: `unknown tool: ${name}` };
			} catch (e) {
				result = { error: (e as Error).message };
			}
			messages.push({
				role: 'tool',
				tool_call_id: call.id,
				name,
				content: JSON.stringify(result ?? null)
			});
		}
	}

	// maxSteps 소진 — 종결 도구를 못 받음.
	throw new LLMResponseError('tool loop reached maxSteps without terminal tool');
}
