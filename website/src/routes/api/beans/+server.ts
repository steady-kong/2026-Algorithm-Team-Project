import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSameOrigin } from '$lib/server/security';
import { checkRateLimit, rateLimitResponse } from '$lib/server/ratelimit';
import {
	readJson,
	requireProfile,
	intInRange,
	optIntInRange,
	numberInRange
} from '$lib/server/validate';
import { greedyRecommend } from '$lib/algorithms/greedy';
import beansData from '$lib/data/beans_mock.json';
import type { Bean } from '$lib/types/bean';

const BEANS = beansData as Bean[];

export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event);
	const rl = await checkRateLimit(event, 'plain');
	if (!rl.ok) return rateLimitResponse(rl);

	const body = await readJson(event.request);
	const profile = requireProfile(body);
	const topK = intInRange(body, 'top_k', 1, 20, 5);
	const minMatchScore = numberInRange(body, 'min_match_score', 0, 1, 0.6);
	const budgetKrw = optIntInRange(body, 'budget_krw', 0, 10_000_000);

	const recommendations = greedyRecommend(profile, BEANS, {
		topK,
		minMatchScore,
		budgetKrw
	});
	return json({ recommendations });
};
