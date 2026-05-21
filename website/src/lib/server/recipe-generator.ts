/**
 * 레시피 후보 생성 + 점수화 + 정렬.
 *
 * 1) 추출 기구별 기준 레시피에서 파라미터를 변주해 N 개 후보를 만든다.
 * 2) 추출 변수(물 온도/비율/분쇄도)가 컵 프로파일에 끼치는 영향을 선형 근사로
 *    추정한다.
 * 3) 추정 컵과 사용자 취향(산미/바디/단맛/쓴맛)의 유사도로 점수를 매긴다.
 * 4) 직접 구현한 mergeSort 로 내림차순 정렬해 1순위 + 차선책을 돌려준다.
 */

import { mergeSort } from '../algorithms/sorting';
import { cupMatchScore, type CupDim } from '../algorithms/score';
import { diversify } from '../algorithms/diversify';
import { GRIND_ORDER, type BeanHint, type GrindSize, type Recipe, type RecipeStep } from '../types/recipe';
import { type BrewMethod } from '../types/brew';
import type { TasteProfile } from '../types/taste';
import type { Constraints } from '../types/constraints';
import {
	CATEGORY_DEFAULTS,
	CATEGORY_DELTAS,
	categoryRequiresMilk,
	MENU_CATEGORIES,
	type AromaType,
	type MenuCategory,
	type MilkTreatment,
	type MilkType,
	type SyrupType,
	type Temperature
} from '../types/menu';
import { defaultBeanHintForCategory } from '../data/bean-hints';
export type { Constraints };

interface BaseRecipe {
	dose: number;
	ratio: number;
	temp: number;
	grind: GrindSize;
	bloom: number | null;
	total: number;
}

// info.md §4.2 의 표준 추출 변수에 맞춰 작성. 비율·온도·시간·분쇄도 모두 SCA Gold Cup
// 권장 범위(추출 수율 18~22%, 90.5~96°C) 안에 들어가도록.
const BASE: Record<BrewMethod, BaseRecipe> = {
	hand_drip: { dose: 18, ratio: 16, temp: 93, grind: 'medium-fine', bloom: 40, total: 180 },
	moka_pot: { dose: 18, ratio: 9, temp: 95, grind: 'fine', bloom: null, total: 300 },
	espresso_machine: {
		dose: 18,
		ratio: 2,
		temp: 93,
		// info.md §4.2 espresso 는 "Fine·균일" — extra-fine 은 터키식.
		grind: 'fine',
		bloom: null,
		total: 28
	},
	aeropress: { dose: 15, ratio: 15, temp: 85, grind: 'medium-fine', bloom: 30, total: 120 },
	french_press: { dose: 30, ratio: 16, temp: 94, grind: 'coarse', bloom: null, total: 240 }
};

const BASE_CUP: Record<BrewMethod, Record<CupDim, number>> = {
	hand_drip: { acidity: 4, body: 2, sweetness: 3, bitterness: 2 },
	moka_pot: { acidity: 2, body: 4, sweetness: 3, bitterness: 4 },
	espresso_machine: { acidity: 3, body: 5, sweetness: 3, bitterness: 4 },
	aeropress: { acidity: 3, body: 3, sweetness: 4, bitterness: 2 },
	french_press: { acidity: 2, body: 5, sweetness: 3, bitterness: 3 }
};

// (물온도 보정, 비율 보정, 분쇄도 단계 보정[+면 더 곱게])
const VARIATIONS: ReadonlyArray<readonly [number, number, number]> = [
	[0, 0, 0],
	[2, -1, 1],
	[-3, 1, -1],
	[4, -2, 1],
	[-2, 2, 0]
];

const K_TEMP: Record<CupDim, number> = { acidity: -0.15, body: 0.15, sweetness: -0.05, bitterness: 0.2 };
const K_RATIO: Record<CupDim, number> = { acidity: 0.15, body: -0.2, sweetness: -0.12, bitterness: -0.15 };
const K_GRIND: Record<CupDim, number> = { acidity: -0.25, body: 0.25, sweetness: -0.08, bitterness: 0.3 };

function grindIndex(grind: string): number {
	const s = grind.trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
	if (s.includes('extra') && s.includes('fine')) return 0;
	if (s.includes('medium-fine')) return 2;
	if (s.includes('medium-coarse')) return 4;
	if (s.includes('coarse')) return 5;
	if (s.includes('fine')) return 1;
	if (s.includes('medium')) return 3;
	return 3;
}

function clampLevel(v: number): number {
	if (v < 1) return 1;
	if (v > 5) return 5;
	return v;
}

function predictCup(
	method: BrewMethod,
	temp: number,
	ratio: number,
	gIdx: number
): Record<CupDim, number> {
	const base = BASE[method];
	const cup = { ...BASE_CUP[method] };
	const dTemp = temp - base.temp;
	const dRatio = ratio - base.ratio;
	const dGrind = grindIndex(base.grind) - gIdx;
	for (const dim of Object.keys(cup) as CupDim[]) {
		const val = cup[dim] + K_TEMP[dim] * dTemp + K_RATIO[dim] * dRatio + K_GRIND[dim] * dGrind;
		cup[dim] = clampLevel(val);
	}
	return cup;
}

/**
 * 추출 기구별 정확한 단계 — info.md §4.2 의 핵심 기법 컬럼을 그대로 옮긴다.
 * 기존 3-step generic 텍스트("물 총 Xg 까지 나누어 부으며 추출") 가 모든 기구에 동일하게
 * 나오던 회귀를 막기 위함. dose / water / bloom / total 은 BASE 에서 흘러온 값을 그대로 사용.
 */
function makeSteps(
	method: BrewMethod,
	dose: number,
	water: number,
	bloom: number | null,
	total: number,
	temp: number,
	grindLabel: string
): RecipeStep[] {
	switch (method) {
		case 'hand_drip': {
			// info.md: 30~45s 블루밍(2~3× 원두 무게의 물) → 2~3차 분할 푸어, 균일한 적심·평평한 베드.
			const bloomWater = Math.max(30, Math.round(dose * 2.5));
			const bloomSec = bloom ?? 35;
			const pour = Math.max(60, total - bloomSec);
			return [
				{
					order: 1,
					description: `드리퍼·필터를 헹구고 ${grindLabel} 분쇄 원두 ${dose}g 를 평평하게 안친다`,
					duration_sec: 20
				},
				{
					order: 2,
					description: `${temp}℃ 물 ${bloomWater}g 를 원두 전체에 골고루 부어 ${bloomSec}초간 블루밍 (CO₂ 배출)`,
					duration_sec: bloomSec
				},
				{
					order: 3,
					description: `2~3 차로 나누어 총 물 ${water}g 까지 천천히 부으며 추출 (베드가 평평하게 유지되도록)`,
					duration_sec: pour
				},
				{
					order: 4,
					description: '드리퍼를 내리고 잔에 옮긴 뒤 한 번 가볍게 흔들어 농도를 균일화',
					duration_sec: null
				}
			];
		}
		case 'moka_pot': {
			// info.md: 보일러에 끓기 직전 물, 바스켓에 탬핑 없이 평평하게, 갈색→금색이면 즉시 불에서 내린다.
			return [
				{
					order: 1,
					description: `하부 보일러에 ${temp}℃ 가까이 데운 물 ${water}g 를 안전 밸브 아래까지 채운다`,
					duration_sec: 30
				},
				{
					order: 2,
					description: `바스켓에 ${grindLabel} 분쇄 원두 ${dose}g 를 평평하게 채우고 *탬핑 없이* 결합`,
					duration_sec: 30
				},
				{
					order: 3,
					description: '중불에 올려 4~5분간 가열, 상부로 올라오는 추출액이 갈색에서 금색으로 변하면 *즉시* 불을 끈다',
					duration_sec: Math.max(180, total - 60)
				},
				{
					order: 4,
					description: '뚜껑을 덮고 본체 바닥을 차가운 행주로 식혀 추출을 멈춘 뒤 잔에 따른다',
					duration_sec: 30
				}
			];
		}
		case 'espresso_machine': {
			// info.md: 1:2 normale, 9 bar, 25~30s. 도징·디스트리뷰션·탬핑이 채널링 좌우.
			const totalSec = total <= 0 ? 28 : total;
			return [
				{
					order: 1,
					description: `포타필터에 ${grindLabel} 분쇄 원두 ${dose}g 를 도징하고 균일하게 분산 후 30 lb 압으로 탬핑`,
					duration_sec: 20
				},
				{
					order: 2,
					description: `머신에 장착하고 ${temp}℃ · 9 bar 로 추출 시작 — ${totalSec}초 내외에 음료 ${water}g 가 떨어지면 정지`,
					duration_sec: totalSec
				},
				{
					order: 3,
					description: '크레마가 살아 있을 때 잔에 옮겨 즉시 서빙 (시간 지나면 크레마·아로마 손실)',
					duration_sec: null
				}
			];
		}
		case 'aeropress': {
			// info.md: 30~60s 침지 → 천천히 압착. 표준·인버티드(거꾸로)·바이패스 변종 다수.
			const steepSec = bloom ?? 60;
			const pressSec = Math.max(20, total - steepSec);
			return [
				{
					order: 1,
					description: `에어로프레스에 종이필터를 끼우고 뜨거운 물로 헹궈 종이맛 제거`,
					duration_sec: 15
				},
				{
					order: 2,
					description: `${grindLabel} 분쇄 원두 ${dose}g 를 챔버에 넣고 ${temp}℃ 물 ${water}g 를 모두 부어 스푼으로 가볍게 교반`,
					duration_sec: 20
				},
				{
					order: 3,
					description: `뚜껑을 덮고 ${steepSec}초간 침지 — 향이 안정될 시간을 준다`,
					duration_sec: steepSec
				},
				{
					order: 4,
					description: `플런저로 ${pressSec}초간 천천히 압착 — '쉭' 소리가 나면 즉시 멈춘다 (잡맛 회피)`,
					duration_sec: pressSec
				}
			];
		}
		case 'french_press': {
			// info.md: 4분 침지 → 거품 걷기 → 천천히 푸시. 미세 거름망 없어 오일·미분 풍부 → 묵직한 바디.
			const steepSec = total <= 0 ? 240 : total;
			return [
				{
					order: 1,
					description: `프레스에 ${grindLabel} 분쇄 원두 ${dose}g 를 담고 ${temp}℃ 물 ${water}g 를 한 번에 모두 붓는다`,
					duration_sec: 30
				},
				{
					order: 2,
					description: '뚜껑은 덮되 누르지 않고 4분간 정치 — 1분 후 표면 거품을 스푼으로 살짝 걷어내면 클린',
					duration_sec: steepSec
				},
				{
					order: 3,
					description: '필터를 *천천히* 끝까지 눌러 미분을 가라앉히고 잔에 따른다 (오일감·바디가 살아남)',
					duration_sec: 30
				}
			];
		}
	}
}

// 분쇄도 한국어 라벨 (recipe 단계 텍스트 안에 들어감). UI 의 GRIND_LABELS 와 동일하지만
// 서버측에서도 step 문자열에 쓰므로 작은 로컬 매핑을 둔다.
const GRIND_KO: Record<GrindSize, string> = {
	'extra-fine': '아주 곱게',
	fine: '곱게',
	'medium-fine': '중간보다 곱게',
	medium: '중간',
	'medium-coarse': '중간보다 굵게',
	coarse: '굵게'
};

function buildRecipe(
	method: BrewMethod,
	args: {
		dose: number;
		ratio: number;
		temp: number;
		grindIndex: number;
		bloom: number | null;
		total: number;
		profile: TasteProfile;
		source: string;
	}
): Recipe {
	const gIdx = Math.max(0, Math.min(GRIND_ORDER.length - 1, args.grindIndex));
	const water = Math.round(args.dose * args.ratio * 10) / 10;
	const cup = predictCup(method, args.temp, args.ratio, gIdx);
	const score = cupMatchScore(cup, args.profile);
	const cupRounded = {
		acidity: Math.round(cup.acidity),
		body: Math.round(cup.body),
		sweetness: Math.round(cup.sweetness),
		bitterness: Math.round(cup.bitterness)
	};
	void args.source;
	const grind: GrindSize = GRIND_ORDER[gIdx];
	return {
		brew_method: method,
		grind_size: grind,
		dose_g: Math.round(args.dose * 10) / 10,
		water_g: water,
		water_temp_c: Math.round(args.temp * 10) / 10,
		bloom_sec: args.bloom,
		total_time_sec: args.total,
		steps: makeSteps(method, args.dose, water, args.bloom, args.total, Math.round(args.temp), GRIND_KO[grind]),
		score: Math.round(score * 10000) / 10000,
		notes: '',
		predicted_cup: cupRounded
	};
}

export function ruleBasedGenerate(
	profile: TasteProfile,
	method: BrewMethod,
	n: number
): Recipe[] {
	const base = BASE[method];
	const baseGrindIdx = grindIndex(base.grind);
	const out: Recipe[] = [];
	for (const [dTemp, dRatio, dGrind] of VARIATIONS.slice(0, n)) {
		out.push(
			buildRecipe(method, {
				dose: base.dose,
				ratio: Math.max(1, base.ratio + dRatio),
				temp: base.temp + dTemp,
				grindIndex: baseGrindIdx - dGrind,
				bloom: base.bloom,
				total: base.total,
				profile,
				source: '규칙 기반 폴백'
			})
		);
	}
	return out;
}

/** LLM 응답에서 추출 변수를 빼와 동일한 점수화·정렬을 적용한다. */
export function buildFromLLM(
	method: BrewMethod,
	profile: TasteProfile,
	items: ReadonlyArray<Record<string, unknown>>,
	n: number
): Recipe[] {
	const out: Recipe[] = [];
	for (const item of items.slice(0, n)) {
		const dose = Number(item.dose_g);
		const water = Number(item.water_g);
		if (!Number.isFinite(dose) || dose <= 0) continue;
		if (!Number.isFinite(water) || water <= 0) continue;
		const ratio = water / dose;
		const temp = Number(item.water_temp_c);
		if (!Number.isFinite(temp)) continue;
		const total = Number(item.total_time_sec);
		if (!Number.isFinite(total)) continue;
		const bloomRaw = item.bloom_sec;
		const bloom =
			bloomRaw === null || bloomRaw === undefined ? null : Number(bloomRaw);
		out.push(
			buildRecipe(method, {
				dose,
				ratio,
				temp,
				grindIndex: grindIndex(String(item.grind_size ?? 'medium')),
				bloom: bloom !== null && Number.isFinite(bloom) ? Math.round(bloom) : null,
				total: Math.round(total),
				profile,
				source: 'Upstage LLM 생성'
			})
		);
	}
	return out;
}

/** 점수 내림차순으로 정렬해 1순위 + 차선책으로 분리한다. */
export function sortByScore(recipes: Recipe[]): { best: Recipe; alternatives: Recipe[] } {
	const ordered = mergeSort(recipes, { key: (r) => r.score, reverse: true });
	const [best, ...alternatives] = ordered;
	return { best, alternatives };
}

// ────────────────────────────────────────────────────────────
// 22.2 메뉴 카테고리 확장 — 추출 레시피 위에 카테고리/우유/시럽/향을 얹는다.
// ────────────────────────────────────────────────────────────

function clamp1to5(n: number): number {
	if (n < 1) return 1;
	if (n > 5) return 5;
	return Math.round(n);
}

/**
 * 추출 레시피에 메뉴 카테고리를 결합한다.
 * - 카테고리의 컵 delta 를 더해 predicted_cup 재계산.
 * - 사용자 취향과의 적합도 점수도 다시 매긴다.
 * - 제약(우유 없음, 아이스/핫, 시럽/향 제외)을 위반하면 null 을 반환해 후보에서 제외.
 */
/**
 * 카테고리별 base recipe 오버라이드.
 * 콜드브루는 차가운 물 + 거친 분쇄 + 장시간 침출 — 가열 추출과 본질적으로 다르다.
 * 아메리카노는 에스프레소에 물을 추가한 결과물이라 base 시간을 그대로 두되 grind/brew 는 espresso 기준.
 */
const CATEGORY_BREW_OVERRIDES: Partial<Record<MenuCategory, {
	brew_method?: BrewMethod;
	grind_size?: GrindSize;
	water_temp_c?: number;
	total_time_sec?: number;
	dose_g?: number;
	water_g?: number;
	bloom_sec?: number | null;
}>> = {
	cold_brew: {
		brew_method: 'french_press',
		grind_size: 'coarse',
		water_temp_c: 4,
		total_time_sec: 43200,
		dose_g: 60,
		water_g: 600,
		bloom_sec: null
	}
};

/** 카테고리별 추출 외 추가 단계 (우유 스팀, 잔 결합 등). steps 끝에 이어붙는다. */
function buildCategorySteps(
	base: Recipe,
	category: MenuCategory,
	milk: MilkType,
	milk_treatment: MilkTreatment,
	syrups: SyrupType[]
): RecipeStep[] {
	void base;
	const out: RecipeStep[] = [];
	let order = 1;

	if (category === 'iced_americano') {
		out.push({
			order: order++,
			description: '잔에 얼음과 차가운 물을 넣고, 추출된 에스프레소를 위에 부어 완성',
			duration_sec: 10
		});
	} else if (category === 'affogato') {
		out.push({
			order: order++,
			description: '잔에 바닐라 아이스크림 한 스쿱을 담고, 추출된 에스프레소를 위에 부어 마시기',
			duration_sec: 10
		});
	} else if (category === 'dalgona') {
		out.push({
			order: order++,
			description: '인스턴트 커피 2 + 설탕 2 + 뜨거운 물 2(스푼)를 거품기로 색이 옅어질 때까지 휘핑',
			duration_sec: 180
		});
		out.push({
			order,
			description: '잔에 우유와 얼음을 채우고, 휘핑한 달고나 크림을 위에 얹기',
			duration_sec: 30
		});
		return out;
	} else if (category === 'cold_brew') {
		out.push({
			order: order++,
			description: '잔에 얼음을 채우고 필터로 거른 콜드브루를 따라 마시기',
			duration_sec: null
		});
		if (milk !== 'none') {
			out.push({
				order,
				description: '취향에 따라 우유나 시럽을 살짝 더해 마무리',
				duration_sec: null
			});
		}
		return out;
	}

	if (milk !== 'none' && category !== 'black' && category !== 'iced_americano') {
		if (milk_treatment === 'cold_foam') {
			out.push({
				order: order++,
				description: '우유를 콜드폼 메이커로 거품을 내어 가볍게 띄울 준비',
				duration_sec: 60
			});
		} else if (milk_treatment === 'microfoam') {
			out.push({
				order: order++,
				description: '우유를 스팀 노즐로 60~65℃ 까지 데우며 부드러운 마이크로폼 형성',
				duration_sec: 45
			});
		} else if (milk_treatment === 'steamed') {
			out.push({
				order: order++,
				description: '우유를 60~65℃ 까지 스팀하여 데우기',
				duration_sec: 40
			});
		} else {
			out.push({
				order: order++,
				description: '우유를 데우거나 차게 준비 (취향에 따라 양 조절)',
				duration_sec: 30
			});
		}
	}

	if (category === 'mocha') {
		out.push({
			order,
			description: '잔 바닥에 초콜릿 소스 20ml 를 두르고, 그 위로 에스프레소 → 우유 순으로 결합',
			duration_sec: null
		});
	} else if (syrups.length > 0) {
		out.push({
			order,
			description: '잔에 시럽을 먼저 넣고, 에스프레소 → 우유 순서로 결합',
			duration_sec: null
		});
	} else if (milk !== 'none' && category !== 'black' && category !== 'iced_americano') {
		out.push({
			order,
			description: '잔에 에스프레소를 받고 데운 우유를 부드럽게 부어 완성',
			duration_sec: null
		});
	}

	return out;
}

export function attachCategory(
	base: Recipe,
	category: MenuCategory,
	profile: TasteProfile,
	constraints: Constraints = {},
	overrides: {
		milk_type?: MilkType;
		aroma?: AromaType;
		syrups?: SyrupType[];
		temperature?: Temperature;
		bean_hint?: BeanHint;
	} = {}
): Recipe | null {
	if (constraints.exclude_brew_method?.includes(base.brew_method)) return null;
	if (constraints.category_only && !constraints.category_only.includes(category)) return null;

	const defaults = CATEGORY_DEFAULTS[category];
	const milk = overrides.milk_type ?? constraints.milk_type ?? defaults.milk;
	if (constraints.exclude_milk && milk !== 'none') return null;
	if (constraints.exclude_milk && categoryRequiresMilk(category)) return null;

	const temperature = overrides.temperature ?? defaults.temperature;
	if (constraints.iced_only && temperature !== 'iced') return null;
	if (constraints.hot_only && temperature !== 'hot') return null;

	let aroma: AromaType = overrides.aroma ?? defaults.recommended_aroma ?? 'none';
	if (constraints.exclude_aroma?.includes(aroma)) aroma = 'none';

	let syrups = overrides.syrups ?? [];
	if (constraints.exclude_syrup && syrups.length > 0) {
		syrups = syrups.filter((s) => !constraints.exclude_syrup?.includes(s));
	}

	// 카테고리 특화 brew 오버라이드. 콜드브루는 base 의 espresso 추출 파라미터를 통째 교체.
	const brewOv = CATEGORY_BREW_OVERRIDES[category];
	let working: Recipe = base;
	if (brewOv) {
		const newBrew = brewOv.brew_method ?? base.brew_method;
		if (constraints.exclude_brew_method?.includes(newBrew)) return null;
		const newDose = brewOv.dose_g ?? base.dose_g;
		const newWater = brewOv.water_g ?? base.water_g;
		const newTotal = brewOv.total_time_sec ?? base.total_time_sec;
		const newBloom = brewOv.bloom_sec === undefined ? base.bloom_sec : brewOv.bloom_sec;
		const newTemp = brewOv.water_temp_c ?? base.water_temp_c;
		const newGrind: GrindSize = brewOv.grind_size ?? base.grind_size;
		const newSteps: RecipeStep[] = category === 'cold_brew'
			? [
					{
						order: 1,
						description: `굵게 분쇄한 원두 ${newDose}g 를 용기에 담기`,
						duration_sec: 30
					},
					{
						order: 2,
						description: `차가운 물 ${newWater}g 를 천천히 부어 원두를 충분히 적시기`,
						duration_sec: 60
					},
					{
						order: 3,
						description: '뚜껑을 덮고 냉장고에서 12시간 침출 (밤새 두면 편함)',
						duration_sec: newTotal - 90
					}
				]
			: base.steps;
		working = {
			...base,
			brew_method: newBrew,
			grind_size: newGrind,
			dose_g: newDose,
			water_g: newWater,
			water_temp_c: newTemp,
			bloom_sec: newBloom,
			total_time_sec: newTotal,
			steps: newSteps
		};
	}

	const delta = CATEGORY_DELTAS[category];
	const cup = {
		acidity: clamp1to5(working.predicted_cup.acidity + delta.acidity),
		body: clamp1to5(working.predicted_cup.body + delta.body),
		sweetness: clamp1to5(working.predicted_cup.sweetness + delta.sweetness + syrups.length),
		bitterness: clamp1to5(working.predicted_cup.bitterness + delta.bitterness)
	};
	const score = cupMatchScore(cup, profile);

	const treatment = defaults.treatment;
	const extraSteps = buildCategorySteps(working, category, milk, treatment, syrups);
	// 달고나는 espresso 추출이 의미 없으므로 extraSteps 만 사용. 나머지는 추출 + 후속 단계 결합.
	const merged: RecipeStep[] =
		category === 'dalgona' ? extraSteps : [...working.steps, ...extraSteps];
	const stepsFinal: RecipeStep[] = merged.map((s, i) => ({ ...s, order: i + 1 }));

	// 달고나는 인스턴트커피가 정체성 — LLM/라이브러리가 산지 원두를 넘겨도 무시하고 디폴트 강제 (§48.4).
	const bean_hint: BeanHint =
		category === 'dalgona'
			? defaultBeanHintForCategory(category, temperature)
			: (overrides.bean_hint ?? defaultBeanHintForCategory(category, temperature));

	return {
		...working,
		steps: stepsFinal,
		menu_category: category,
		milk_type: milk,
		milk_treatment: treatment,
		temperature,
		aroma,
		syrups,
		topping: 'none',
		non_dairy_creamer: false,
		predicted_cup: cup,
		score: Math.round(score * 10000) / 10000,
		notes: '',
		bean_hint
	};
}

/**
 * 기본(블랙) 후보 N 개를 만든 뒤 카테고리들을 cross product 로 곱해 메뉴별 변주를
 * 만들고, 제약 필터링 → 점수 정렬 → 카테고리 다양성 재배치를 거친다.
 *
 * 초보자 모드에서 LLM 이 `category_hint` 를 줘서 후보 카테고리 풀을 좁힐 수 있다.
 */
export function buildMenuCandidates(
	baseRecipes: readonly Recipe[],
	profile: TasteProfile,
	opts: {
		categoryPool?: readonly MenuCategory[];
		constraints?: Constraints;
		topK?: number;
	} = {}
): Recipe[] {
	const pool = (opts.categoryPool ?? MENU_CATEGORIES).filter(
		(c) => !opts.constraints?.category_only || opts.constraints.category_only.includes(c)
	);
	const candidates: Recipe[] = [];
	for (const base of baseRecipes) {
		for (const cat of pool) {
			const r = attachCategory(base, cat, profile, opts.constraints ?? {});
			if (r) candidates.push(r);
		}
	}
	const sorted = mergeSort(candidates, { key: (r) => r.score, reverse: true });
	const topK = opts.topK ?? 10;
	return diversify(sorted, {
		groupKey: (r) => r.menu_category,
		topK
	}).slice(0, topK);
}
