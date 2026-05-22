import { json, error } from '@sveltejs/kit';
import { recommend } from '$lib/server/recommend';
import { readUpstageEnv } from '$lib/server/env';
import type { RequestHandler } from './$types';

const MAX_LEN = 300;

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid JSON');
	}
	const message = (body as { message?: unknown })?.message;
	if (typeof message !== 'string' || message.trim().length === 0) {
		throw error(400, 'message is required');
	}
	const result = await recommend(message.slice(0, MAX_LEN), readUpstageEnv(platform));
	return json(result);
};
