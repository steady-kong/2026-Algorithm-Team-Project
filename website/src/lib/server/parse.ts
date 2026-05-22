import {
	applyDelta,
	clampProfile,
	neutralProfile,
	isTasteProfile,
	type TasteProfile,
	type TasteAxis
} from '$lib/types/taste';
import { isBrewMethod, type BrewMethod, type CoffeeRecipe } from '$lib/types/recipe';

/**
 * Deterministic natural-language → taste mapping.
 *
 * This is the FALLBACK brain used when there is no Upstage key (or the LLM call
 * fails). It is intentionally simple keyword matching: each phrase nudges one or
 * more axes by a signed delta. Good enough to demo the whole pipeline offline.
 */

interface Rule {
	patterns: RegExp;
	delta: Partial<Record<TasteAxis, number>>;
}

const CRAVING_RULES: Rule[] = [
	{ patterns: /(산미|상큼|새콤|프루티|과일|베리|꽃|플로럴|상큼|fruity|acid)/i, delta: { acidity: 2 } },
	{ patterns: /(산미.?없|덜.?시|시지.?않|신맛.?싫)/i, delta: { acidity: -2 } },
	{ patterns: /(달콤|달달|단맛|스위트|sweet|디저트)/i, delta: { sweetness: 2 } },
	{ patterns: /(안.?달|덜.?달|단거.?싫|쌉싸름)/i, delta: { sweetness: -1, bitterness: 1 } },
	{ patterns: /(진하게|강하게|쓴|쓰게|스트롱|strong|bold|에스프레소|샷추가)/i, delta: { bitterness: 2, body: 1 } },
	{ patterns: /(덜.?쓴|안.?쓴|순하게|마일드|mild)/i, delta: { bitterness: -2 } },
	{ patterns: /(부드러|크리미|고소|smooth|creamy)/i, delta: { bitterness: -1, body: 1, sweetness: 1 } },
	{ patterns: /(묵직|꾸덕|진득|풀바디|heavy|full.?body|바디감.?있)/i, delta: { body: 2 } },
	{ patterns: /(가벼운|라이트|연하게|깔끔|클린|light|clean|water)/i, delta: { body: -2, bitterness: -1 } }
];

const METHOD_RULES: { patterns: RegExp; method: BrewMethod }[] = [
	{ patterns: /(라떼|latte)/i, method: 'latte' },
	{ patterns: /(콜드브루|cold.?brew|아이스)/i, method: 'cold_brew' },
	{ patterns: /(핸드드립|드립|푸어|pour.?over)/i, method: 'pour_over' },
	{ patterns: /(에스프레소|espresso|샷)/i, method: 'espresso' },
	{ patterns: /(프렌치프레스|french.?press)/i, method: 'french_press' },
	{ patterns: /(에어로프레스|aeropress)/i, method: 'aeropress' },
	{ patterns: /(모카포트|모카|moka)/i, method: 'moka_pot' }
];

export interface ParsedCraving {
	profile: TasteProfile;
	methods: BrewMethod[];
	budget?: number;
}

export function parseCravingRules(message: string): ParsedCraving {
	let profile = neutralProfile();
	for (const rule of CRAVING_RULES) {
		if (rule.patterns.test(message)) profile = applyDelta(profile, rule.delta);
	}
	const methods: BrewMethod[] = [];
	for (const m of METHOD_RULES) if (m.patterns.test(message)) methods.push(m.method);

	const budget = parseBudget(message);
	return { profile: clampProfile(profile), methods, ...(budget ? { budget } : {}) };
}

/** Refine: a follow-up line produces a signed delta against the current target. */
export function parseDeltaRules(message: string): Partial<TasteProfile> {
	const delta: Partial<Record<TasteAxis, number>> = {};
	const bump = (axis: TasteAxis, by: number) => {
		delta[axis] = (delta[axis] ?? 0) + by;
	};
	if (/(더.?진하|더.?강하|더.?쓰|진하게|쓴맛.?up)/i.test(message)) {
		bump('bitterness', 1);
		bump('body', 1);
	}
	if (/(덜.?쓰|덜.?진하|순하게|부드럽게)/i.test(message)) bump('bitterness', -1);
	if (/(더.?달|달게|단맛.?up)/i.test(message)) bump('sweetness', 1);
	if (/(덜.?달|안.?달게)/i.test(message)) bump('sweetness', -1);
	if (/(산미.?더|더.?상큼|더.?새콤|시게)/i.test(message)) bump('acidity', 1);
	if (/(산미.?덜|덜.?시게|신맛.?down)/i.test(message)) bump('acidity', -1);
	if (/(더.?묵직|바디.?up|진득)/i.test(message)) bump('body', 1);
	if (/(가볍게|라이트하게|연하게|깔끔하게)/i.test(message)) bump('body', -1);
	return delta;
}

/** "다른 거", "또 보여줘" style requests want variety, not a taste change. */
export function wantsVariety(message: string): boolean {
	return /(다른.?거|다른.?것|또|새로운|딴거|different|another|more)/i.test(message);
}

function parseBudget(message: string): number | undefined {
	// crude: matches small unitless budgets like "예산 8" or "8 정도" used by the flight feature
	const m = message.match(/예산\s*(\d{1,3})/);
	if (m) return Number(m[1]);
	return undefined;
}

/* --------------------- validation of untrusted LLM output --------------------- */

/** Validate & sanitise an LLM-proposed recipe into our CoffeeRecipe shape. */
export function sanitizeLlmRecipe(raw: unknown, index: number): CoffeeRecipe | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const o = raw as Record<string, unknown>;
	if (!isTasteProfile(o.profile)) return null;
	const method = isBrewMethod(o.method) ? o.method : 'pour_over';
	const nameKo = typeof o.nameKo === 'string' && o.nameKo ? o.nameKo : `추천 ${index + 1}`;
	const steps = Array.isArray(o.steps) ? o.steps.filter((s) => typeof s === 'string').slice(0, 6) : [];
	return {
		id: typeof o.id === 'string' && o.id ? `llm-${o.id}` : `llm-${index}`,
		name: typeof o.name === 'string' && o.name ? o.name : nameKo,
		nameKo,
		bean: {
			origin: typeof (o.bean as Record<string, unknown>)?.origin === 'string'
				? ((o.bean as Record<string, unknown>).origin as string)
				: '하우스 블렌드',
			roast: 'medium'
		},
		method,
		profile: clampProfile(o.profile as TasteProfile),
		cost: clampNumber(o.cost, 1, 10, 4),
		effort: clampNumber(o.effort, 1, 5, 3),
		brewTimeMin: clampNumber(o.brewTimeMin, 1, 1440, 4),
		steps: steps.length ? (steps as string[]) : ['추출 단계 정보 없음'],
		story: typeof o.story === 'string' ? o.story : undefined
	};
}

function clampNumber(v: unknown, min: number, max: number, fallback: number): number {
	if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
	return Math.min(max, Math.max(min, v));
}
