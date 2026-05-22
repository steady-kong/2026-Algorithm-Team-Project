import {
	applyDelta,
	clampAxis,
	neutralProfile,
	type TasteProfile
} from '$lib/types/taste';
import type { BrewMethod, CoffeeRecipe, ScoredRecipe } from '$lib/types/recipe';
import { RECIPES } from '$lib/data/recipes';
import {
	matchScore,
	mergeSort,
	diversify,
	knapsackFlight,
	lowerBound,
	buildTasteGraph,
	dijkstra,
	tasteDistance,
	type KnapsackResult
} from '$lib/algorithms';
import { chatJson, hasUpstageKey, type UpstageEnv } from './upstage';
import { parseCravingRules, parseDeltaRules, sanitizeLlmRecipe } from './parse';

export interface JourneyStep {
	recipe: CoffeeRecipe;
}
export interface RecommendResult {
	target: TasteProfile;
	methods: BrewMethod[];
	cards: ScoredRecipe[]; // top 3, diversified
	flight: { items: ScoredRecipe[]; totalCost: number; totalValue: number; budget: number };
	journey: { steps: CoffeeRecipe[]; distance: number };
	source: 'llm' | 'rules';
}

const DEFAULT_BUDGET = 12;
const TOP_K = 3;

// The seed catalog is static, so its taste graph is built once at module load.
const TASTE_GRAPH = buildTasteGraph(RECIPES, 4);

/** Initial recommendation from a free-text craving. */
export async function recommend(message: string, env: UpstageEnv | undefined): Promise<RecommendResult> {
	const rules = parseCravingRules(message);
	const llm = await generateCandidatesLlm(message, rules.profile, env);
	const target = llm?.target ?? rules.profile;
	const pool = mergePool(llm?.candidates ?? []);
	return runPipeline({
		target,
		pool,
		methods: rules.methods,
		budget: rules.budget ?? DEFAULT_BUDGET,
		excludeIds: [],
		source: llm ? 'llm' : 'rules'
	});
}

/** Follow-up refinement: nudge the target, regenerate, avoid already-shown items. */
export async function refine(
	message: string,
	currentTarget: TasteProfile,
	shownIds: string[],
	env: UpstageEnv | undefined
): Promise<RecommendResult> {
	const delta = parseDeltaRules(message);
	const target = applyDelta(currentTarget, delta);
	const llm = await generateCandidatesLlm(message, target, env);
	const pool = mergePool(llm?.candidates ?? []);
	return runPipeline({
		target,
		pool,
		methods: [],
		budget: DEFAULT_BUDGET,
		excludeIds: shownIds,
		source: llm ? 'llm' : 'rules'
	});
}

/* ----------------------------- core pipeline ----------------------------- */

interface PipelineInput {
	target: TasteProfile;
	pool: CoffeeRecipe[];
	methods: BrewMethod[];
	budget: number;
	excludeIds: string[];
	source: 'llm' | 'rules';
}

/**
 * The deterministic core: given a target profile and a candidate pool, run the
 * hand-written algorithms to produce the final UI payload.
 *   score → mergeSort → (greedy) diversify → top 3
 *   binary-search the affordable slice → 0/1 knapsack tasting flight
 *   Dijkstra a smooth taste journey from a neutral baseline to the top pick
 */
function runPipeline({ target, pool, methods, budget, excludeIds, source }: PipelineInput): RecommendResult {
	const exclude = new Set(excludeIds);
	let candidates = pool.filter((r) => !exclude.has(r.id));

	// If the user named brew methods and we still have enough, narrow to them.
	if (methods.length > 0) {
		const narrowed = candidates.filter((r) => methods.includes(r.method));
		if (narrowed.length >= TOP_K) candidates = narrowed;
	}
	if (candidates.length === 0) candidates = pool.slice();

	// 1) score every candidate against the target taste
	const scored: ScoredRecipe[] = candidates.map((recipe) => ({
		recipe,
		score: matchScore(recipe.profile, target)
	}));

	// 2) stable merge sort by fit, descending (ties keep generation order)
	const ranked = mergeSort(scored, (s) => s.score, true);

	// 3) greedy diversify into the final TOP_K cards
	const cards = diversify(ranked, TOP_K);

	// 4) tasting flight: binary-search the affordable slice, then 0/1 knapsack it
	const byCost = mergeSort(scored, (s) => s.recipe.cost, false);
	const affordableCount = lowerBound(byCost, budget + 1, (s) => s.recipe.cost);
	const affordable = byCost.slice(0, affordableCount);
	const flightRes: KnapsackResult = knapsackFlight(affordable, budget);

	// 5) Dijkstra a smooth journey across the stable seed graph
	const journey = buildJourney(target, cards[0]?.recipe);

	return {
		target,
		methods,
		cards,
		flight: {
			items: flightRes.chosen,
			totalCost: flightRes.totalCost,
			totalValue: flightRes.totalValue,
			budget
		},
		journey,
		source
	};
}

/** Dijkstra over the seed catalog: from the drink nearest "neutral" to the top pick. */
function buildJourney(target: TasteProfile, topPick: CoffeeRecipe | undefined): {
	steps: CoffeeRecipe[];
	distance: number;
} {
	if (!topPick) return { steps: [], distance: 0 };
	const startIdx = nearestIndex(RECIPES, neutralProfile());
	// goal: the seed recipe closest to the chosen pick (the pick may be LLM-made)
	const goalIdx = nearestIndex(RECIPES, topPick.profile);
	if (startIdx === goalIdx) return { steps: [RECIPES[goalIdx]], distance: 0 };
	const { dist, path } = dijkstra(TASTE_GRAPH, startIdx, goalIdx);
	if (path.length === 0) return { steps: [RECIPES[goalIdx]], distance: 0 };
	return { steps: path.map((i) => RECIPES[i]), distance: dist };
}

function nearestIndex(recipes: readonly CoffeeRecipe[], target: TasteProfile): number {
	let best = 0;
	let bestD = Infinity;
	for (let i = 0; i < recipes.length; i++) {
		const d = tasteDistance(recipes[i].profile, target);
		if (d < bestD) {
			bestD = d;
			best = i;
		}
	}
	return best;
}

/** LLM candidates first (variety/freshness), then seed catalog, de-duplicated. */
function mergePool(llmCandidates: CoffeeRecipe[]): CoffeeRecipe[] {
	const seen = new Set<string>();
	const out: CoffeeRecipe[] = [];
	for (const r of [...llmCandidates, ...RECIPES]) {
		if (seen.has(r.id)) continue;
		seen.add(r.id);
		out.push(r);
	}
	return out;
}

/* ------------------------------ LLM generation ------------------------------ */

interface LlmPayload {
	target: TasteProfile;
	candidates: CoffeeRecipe[];
}

async function generateCandidatesLlm(
	message: string,
	hint: TasteProfile,
	env: UpstageEnv | undefined
): Promise<LlmPayload | null> {
	if (!hasUpstageKey(env)) return null;
	const system = `너는 커피 추천 도우미다. 사용자의 한국어 요청을 읽고:
1) 목표 맛 프로파일을 1~5 정수로 추정한다 (acidity 신맛, sweetness 단맛, bitterness 쓴맛, body 바디감).
2) 그 취향에 맞는 현실적인 커피 후보 6개를 생성한다. 메뉴 카탈로그에 의존하지 말고 직접 떠올려라.
반드시 아래 JSON만 출력한다:
{"target":{"acidity":n,"sweetness":n,"bitterness":n,"body":n},
 "candidates":[{"id":"slug","name":"English","nameKo":"한글명","bean":{"origin":"산지"},
   "method":"espresso|pour_over|french_press|cold_brew|aeropress|moka_pot|latte",
   "profile":{"acidity":n,"sweetness":n,"bitterness":n,"body":n},
   "cost":1~10,"effort":1~5,"brewTimeMin":n,"steps":["..."],"story":"한 줄"}]}`;
	const user = `요청: "${message}"\n참고 추정 프로파일: ${JSON.stringify(hint)}`;

	const raw = await chatJson<{ target?: unknown; candidates?: unknown[] }>(env, [
		{ role: 'system', content: system },
		{ role: 'user', content: user }
	]);
	if (!raw || !Array.isArray(raw.candidates)) return null;

	const candidates: CoffeeRecipe[] = [];
	raw.candidates.forEach((c, i) => {
		const recipe = sanitizeLlmRecipe(c, i);
		if (recipe) candidates.push(recipe);
	});
	if (candidates.length === 0) return null;

	const target =
		raw.target && typeof raw.target === 'object'
			? sanitizeTarget(raw.target as Record<string, unknown>, hint)
			: hint;
	return { target, candidates };
}

function sanitizeTarget(o: Record<string, unknown>, fallback: TasteProfile): TasteProfile {
	const pick = (k: keyof TasteProfile) =>
		typeof o[k] === 'number' ? clampAxis(o[k] as number) : fallback[k];
	return {
		acidity: pick('acidity'),
		sweetness: pick('sweetness'),
		bitterness: pick('bitterness'),
		body: pick('body')
	};
}
