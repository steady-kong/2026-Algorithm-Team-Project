/**
 * Recipe 한 객체에서 화면 표시용 "준비물 / 단계 / 총 시간" 을 유도한다.
 * LLM 추가 호출 없이 결정적인 매핑만 사용한다.
 */

import type { Recipe } from '../types/recipe';
import { GRIND_LABELS } from '../types/recipe';
import { BREW_METHOD_LABELS } from '../types/brew';
import { ROAST_LABELS } from '../data/bean-hints';
import {
	MILK_TYPE_LABELS,
	MILK_TREATMENT_LABELS,
	SYRUP_LABELS,
	AROMA_LABELS,
	TOPPING_LABELS,
	MENU_CATEGORY_LABELS,
	type MenuCategory
} from '../types/menu';

export interface Ingredient {
	icon: string;
	label: string;
	detail: string;
}

/** 카테고리별 표준 우유 사용량 (ml). 메뉴 정체성에 맞춘 근사치. */
const CATEGORY_MILK_ML: Partial<Record<MenuCategory, number>> = {
	latte: 200,
	cappuccino: 150,
	flat_white: 150,
	mocha: 180,
	macchiato: 30,
	cortado: 60,
	dalgona: 200
};

/** 카테고리별 시럽/초콜릿 소스 기본량 (ml). */
const CATEGORY_BASE_SAUCE: Partial<Record<MenuCategory, { name: string; ml: number }>> = {
	mocha: { name: '초콜릿 소스', ml: 20 }
};

export function deriveIngredients(recipe: Recipe): Ingredient[] {
	const out: Ingredient[] = [];

	// 원두는 항상 두 줄: (1) 양·분쇄도, (2) 추천 산지·로스트·풍미 노트 — info.md 5축 매핑을
	// 추천 단계에서 그대로 컵에 안착시키기 위함.
	const hint = recipe.bean_hint;
	if (hint) {
		const notes = hint.notes.length > 0 ? ` · ${hint.notes.join(' · ')}` : '';
		out.push({
			icon: '🌱',
			label: '추천 원두',
			detail: `${hint.origin} · ${ROAST_LABELS[hint.roast].ko}${notes}`
		});
	}

	out.push({
		icon: '🫘',
		label: '원두 양',
		detail: `${recipe.dose_g}g · 분쇄도 ${GRIND_LABELS[recipe.grind_size]}`
	});

	out.push({
		icon: '💧',
		label: '물',
		detail: `${recipe.water_g}g · ${recipe.water_temp_c}℃`
	});

	if (recipe.milk_type && recipe.milk_type !== 'none') {
		const category = recipe.menu_category;
		const ml = category ? CATEGORY_MILK_ML[category] : undefined;
		const treatment = recipe.milk_treatment && recipe.milk_treatment !== 'none'
			? ` · ${MILK_TREATMENT_LABELS[recipe.milk_treatment]}`
			: '';
		out.push({
			icon: '🥛',
			label: MILK_TYPE_LABELS[recipe.milk_type],
			detail: ml ? `${ml}ml${treatment}` : `적당량${treatment}`
		});
	}

	const sauce = recipe.menu_category ? CATEGORY_BASE_SAUCE[recipe.menu_category] : undefined;
	if (sauce) {
		out.push({ icon: '🍫', label: sauce.name, detail: `${sauce.ml}ml` });
	}

	if (recipe.syrups && recipe.syrups.length > 0) {
		const text = recipe.syrups.map((s) => SYRUP_LABELS[s]).join(', ');
		out.push({
			icon: '🍯',
			label: `${text} 시럽`,
			detail: `${recipe.syrups.length} 펌프 (≈${recipe.syrups.length * 8}ml)`
		});
	}

	if (recipe.aroma && recipe.aroma !== 'none') {
		// 시나몬 같은 향은 파우더로, 헤이즐넛/바닐라/초콜릿은 (시럽 외에) 향 첨가물로 표기.
		const isPowder = recipe.aroma === 'cinnamon';
		out.push({
			icon: isPowder ? '🌿' : '✨',
			label: `${AROMA_LABELS[recipe.aroma]} 향`,
			detail: isPowder ? '한 꼬집' : '몇 방울'
		});
	}

	if (recipe.topping && recipe.topping !== 'none') {
		out.push({
			icon: '🍦',
			label: TOPPING_LABELS[recipe.topping],
			detail: '취향껏'
		});
	}

	if (recipe.non_dairy_creamer) {
		out.push({ icon: '🥄', label: '프림', detail: '1 티스푼' });
	}

	return out;
}

export interface DerivedStep {
	order: number;
	description: string;
	duration_sec: number | null;
}

export function deriveSteps(recipe: Recipe): DerivedStep[] {
	const steps: DerivedStep[] = recipe.steps.map((s) => ({
		order: s.order,
		description: s.description,
		duration_sec: s.duration_sec
	}));

	// 우유 스팀이 필요한 메뉴면 단계 추가.
	if (
		recipe.milk_treatment === 'steamed' ||
		recipe.milk_treatment === 'microfoam' ||
		recipe.milk_treatment === 'cold_foam'
	) {
		const ml = recipe.menu_category ? CATEGORY_MILK_ML[recipe.menu_category] : undefined;
		const amount = ml ? `${ml}ml ` : '';
		const action =
			recipe.milk_treatment === 'cold_foam'
				? `${amount}우유를 콜드폼 메이커로 거품 내기`
				: recipe.milk_treatment === 'microfoam'
					? `${amount}우유를 스팀하며 60~65℃ 까지, 마이크로폼 형성`
					: `${amount}우유를 60~65℃ 까지 스팀`;
		steps.push({
			order: steps.length + 1,
			description: action,
			duration_sec: recipe.milk_treatment === 'cold_foam' ? 60 : 45
		});
	}

	// 시럽/초콜릿이 있으면 결합 단계 안내.
	if (
		(recipe.syrups && recipe.syrups.length > 0) ||
		recipe.menu_category === 'mocha'
	) {
		steps.push({
			order: steps.length + 1,
			description: '잔 바닥에 시럽/소스를 먼저 넣고, 그 위로 추출물 → 우유 순서로 결합',
			duration_sec: null
		});
	}

	if (recipe.topping && recipe.topping !== 'none') {
		steps.push({
			order: steps.length + 1,
			description: `${TOPPING_LABELS[recipe.topping]} 토핑 올리기`,
			duration_sec: null
		});
	}

	return steps;
}

export function recipeTitle(recipe: Recipe): string {
	if (recipe.display_name) return recipe.display_name;
	if (recipe.menu_category) return MENU_CATEGORY_LABELS[recipe.menu_category];
	return BREW_METHOD_LABELS[recipe.brew_method];
}

export function totalTimeText(recipe: Recipe): string {
	const t = recipe.total_time_sec;
	if (t < 60) return `약 ${t}초`;
	const min = Math.floor(t / 60);
	const sec = t % 60;
	return sec === 0 ? `약 ${min}분` : `약 ${min}분 ${sec}초`;
}
