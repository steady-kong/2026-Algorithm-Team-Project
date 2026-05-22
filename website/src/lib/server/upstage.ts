/**
 * Upstage Solar client — OpenAI-compatible Chat Completions over plain fetch
 * (no SDK, to keep the Workers bundle small).
 *
 * The LLM's only job is GENERATION: turn a free-text craving into a target taste
 * profile and a pool of candidate recipes. All ranking/selection is done by the
 * hand-written algorithms afterwards. Everything here is best-effort — callers
 * must have a deterministic fallback, because there may be no API key at all.
 *
 * Docs: https://console.upstage.ai/docs/models/solar-pro-3
 */

const BASE_URL = 'https://api.upstage.ai/v1/chat/completions';
const DEFAULT_MODEL = 'solar-pro3';
const TIMEOUT_MS = 12_000;

export interface UpstageEnv {
	UPSTAGE_API_KEY?: string;
	UPSTAGE_MODEL?: string;
}

export function hasUpstageKey(env: UpstageEnv | undefined): boolean {
	return !!env?.UPSTAGE_API_KEY && env.UPSTAGE_API_KEY.length > 0;
}

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

/**
 * Single-shot JSON chat. Returns parsed JSON of type T, or null on any failure
 * (no key, network error, timeout, bad JSON). Callers fall back deterministically.
 */
export async function chatJson<T>(
	env: UpstageEnv | undefined,
	messages: ChatMessage[]
): Promise<T | null> {
	if (!hasUpstageKey(env)) return null;
	const model = env!.UPSTAGE_MODEL || DEFAULT_MODEL;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(BASE_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env!.UPSTAGE_API_KEY}`
			},
			body: JSON.stringify({
				model,
				messages,
				temperature: 0.4,
				response_format: { type: 'json_object' }
			}),
			signal: controller.signal
		});
		if (!res.ok) return null;
		const data = (await res.json()) as {
			choices?: { message?: { content?: string } }[];
		};
		const content = data.choices?.[0]?.message?.content;
		if (!content) return null;
		return JSON.parse(content) as T;
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}
