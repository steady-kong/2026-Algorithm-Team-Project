import { json, error } from '@sveltejs/kit';
import { refine } from '$lib/server/recommend';
import { readUpstageEnv } from '$lib/server/env';
import { isTasteProfile, clampProfile } from '$lib/types/taste';
import type { RequestHandler } from './$types';

const MAX_LEN = 300;

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'invalid JSON');
	}
	const b = body as { message?: unknown; target?: unknown; shownIds?: unknown };
	if (typeof b.message !== 'string' || b.message.trim().length === 0) {
		throw error(400, 'message is required');
	}
	if (!isTasteProfile(b.target)) {
		throw error(400, 'valid target profile is required');
	}
	const shownIds = Array.isArray(b.shownIds)
		? b.shownIds.filter((x): x is string => typeof x === 'string').slice(0, 50)
		: [];

	const result = await refine(
		b.message.slice(0, MAX_LEN),
		clampProfile(b.target),
		shownIds,
		readUpstageEnv(platform)
	);
	return json(result);
};
