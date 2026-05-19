/**
 * 메뉴 카테고리 / 우유 / 시럽 / 향 / 토핑 차원.
 *
 * 기존 Recipe 의 추출 변수(분쇄도, 물 온도 등) 위에 카페 메뉴 차원을 얹는다.
 * Recipe 의 모든 신규 필드는 optional → 기본 블랙 커피 흐름은 그대로 동작.
 */

export const MENU_CATEGORIES = [
	'black',
	'latte',
	'cappuccino',
	'flat_white',
	'mocha',
	'macchiato',
	'cortado',
	'affogato',
	'cold_brew',
	'iced_americano',
	'dalgona'
] as const;
export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
	black: '블랙 커피',
	latte: '카페라떼',
	cappuccino: '카푸치노',
	flat_white: '플랫화이트',
	mocha: '카페모카',
	macchiato: '마키아토',
	cortado: '꼬르타도',
	affogato: '아포가토',
	cold_brew: '콜드브루',
	iced_americano: '아이스 아메리카노',
	dalgona: '달고나 커피'
};

export const MILK_TYPES = ['none', 'whole', 'low_fat', 'oat', 'soy', 'almond'] as const;
export type MilkType = (typeof MILK_TYPES)[number];

export const MILK_TYPE_LABELS: Record<MilkType, string> = {
	none: '없음',
	whole: '일반 우유',
	low_fat: '저지방 우유',
	oat: '오트 우유',
	soy: '두유',
	almond: '아몬드 우유'
};

export const MILK_TREATMENTS = ['none', 'steamed', 'microfoam', 'cold_foam'] as const;
export type MilkTreatment = (typeof MILK_TREATMENTS)[number];

export const MILK_TREATMENT_LABELS: Record<MilkTreatment, string> = {
	none: '처리 없음',
	steamed: '스팀',
	microfoam: '마이크로폼',
	cold_foam: '콜드폼'
};

export const SYRUPS = ['vanilla', 'caramel', 'hazelnut', 'mint', 'chocolate'] as const;
export type SyrupType = (typeof SYRUPS)[number];

export const SYRUP_LABELS: Record<SyrupType, string> = {
	vanilla: '바닐라',
	caramel: '카라멜',
	hazelnut: '헤이즐넛',
	mint: '민트',
	chocolate: '초콜릿'
};

export const AROMAS = ['none', 'hazelnut', 'vanilla', 'chocolate', 'cinnamon'] as const;
export type AromaType = (typeof AROMAS)[number];

export const AROMA_LABELS: Record<AromaType, string> = {
	none: '향 없음',
	hazelnut: '헤이즐넛',
	vanilla: '바닐라',
	chocolate: '초콜릿',
	cinnamon: '시나몬'
};

export const TOPPINGS = ['none', 'whipped_cream', 'cocoa_powder', 'cinnamon'] as const;
export type ToppingType = (typeof TOPPINGS)[number];

export const TOPPING_LABELS: Record<ToppingType, string> = {
	none: '토핑 없음',
	whipped_cream: '휘핑크림',
	cocoa_powder: '코코아 파우더',
	cinnamon: '시나몬 파우더'
};

export type Temperature = 'hot' | 'iced';

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
	hot: '핫',
	iced: '아이스'
};

/**
 * 카테고리별 기본 컵 프로파일 (1~5).
 * 추출 단계에서 계산한 컵 프로파일에 더해서 메뉴 변형의 영향을 반영한다.
 * delta 형태(부호 있는 정수)로 두어 합산 후 1~5 로 clamp.
 */
export const CATEGORY_DELTAS: Record<
	MenuCategory,
	{ acidity: number; body: number; sweetness: number; bitterness: number }
> = {
	black: { acidity: 0, body: 0, sweetness: 0, bitterness: 0 },
	latte: { acidity: -1, body: 1, sweetness: 1, bitterness: -1 },
	cappuccino: { acidity: -1, body: 1, sweetness: 0, bitterness: 0 },
	flat_white: { acidity: 0, body: 1, sweetness: 0, bitterness: 0 },
	mocha: { acidity: -1, body: 1, sweetness: 2, bitterness: 0 },
	macchiato: { acidity: 0, body: 0, sweetness: 0, bitterness: 1 },
	cortado: { acidity: 0, body: 1, sweetness: 1, bitterness: 0 },
	affogato: { acidity: -1, body: 1, sweetness: 2, bitterness: -1 },
	cold_brew: { acidity: -1, body: 0, sweetness: 1, bitterness: 0 },
	iced_americano: { acidity: 0, body: -1, sweetness: 0, bitterness: 0 },
	dalgona: { acidity: -1, body: 0, sweetness: 2, bitterness: -1 }
};

/** 카테고리 기본 변형 (우유/거품/온도). 사용자가 명시하지 않을 때 채워준다. */
export const CATEGORY_DEFAULTS: Record<
	MenuCategory,
	{
		milk: MilkType;
		treatment: MilkTreatment;
		temperature: Temperature;
		recommended_aroma?: AromaType;
	}
> = {
	black: { milk: 'none', treatment: 'none', temperature: 'hot' },
	latte: { milk: 'whole', treatment: 'microfoam', temperature: 'hot' },
	cappuccino: { milk: 'whole', treatment: 'microfoam', temperature: 'hot' },
	flat_white: { milk: 'whole', treatment: 'microfoam', temperature: 'hot' },
	mocha: { milk: 'whole', treatment: 'steamed', temperature: 'hot', recommended_aroma: 'chocolate' },
	macchiato: { milk: 'whole', treatment: 'microfoam', temperature: 'hot' },
	cortado: { milk: 'whole', treatment: 'steamed', temperature: 'hot' },
	affogato: { milk: 'none', treatment: 'none', temperature: 'hot' },
	cold_brew: { milk: 'none', treatment: 'none', temperature: 'iced' },
	iced_americano: { milk: 'none', treatment: 'none', temperature: 'iced' },
	dalgona: { milk: 'whole', treatment: 'cold_foam', temperature: 'hot' }
};

/** 카테고리에 우유가 강제로 들어가는지 (constraint 충돌 처리용). */
export function categoryRequiresMilk(c: MenuCategory): boolean {
	return CATEGORY_DEFAULTS[c].milk !== 'none';
}

/**
 * 카드 비주얼 — 사진/일러스트 자산 없이 카테고리 정체성을 한 눈에 보여주기 위한 매핑.
 * `gradient` 는 Tailwind class 가 아닌 inline `style` 로 사용 (보안: 사용자 입력 아님,
 * 빌드 타임에 고정된 enum 매핑이라 sanitize 불필요).
 */
export interface CategoryVisual {
	emoji: string;
	gradient: string;
	hint: string;
}

export const CATEGORY_VISUALS: Record<MenuCategory, CategoryVisual> = {
	black: { emoji: '☕', gradient: 'linear-gradient(135deg, #3b2a1d 0%, #1a120b 100%)', hint: '진한 추출의 검은 잔' },
	latte: { emoji: '🥛', gradient: 'linear-gradient(135deg, #d6b58a 0%, #a47148 100%)', hint: '부드러운 우유 베이스' },
	cappuccino: { emoji: '☁️', gradient: 'linear-gradient(135deg, #efe2cf 0%, #9b6f3f 100%)', hint: '풍성한 거품' },
	flat_white: { emoji: '🍶', gradient: 'linear-gradient(135deg, #c89f7a 0%, #7a4f30 100%)', hint: '얇은 폼·진한 우유' },
	mocha: { emoji: '🍫', gradient: 'linear-gradient(135deg, #6b4226 0%, #2d150a 100%)', hint: '초콜릿과 에스프레소' },
	macchiato: { emoji: '🎯', gradient: 'linear-gradient(135deg, #b88a5a 0%, #4a2a17 100%)', hint: '에스프레소에 우유 한 방울' },
	cortado: { emoji: '🤎', gradient: 'linear-gradient(135deg, #b07a4a 0%, #5a371d 100%)', hint: '1:1 균형의 작은 잔' },
	affogato: { emoji: '🍨', gradient: 'linear-gradient(135deg, #f7e7cf 0%, #6b4226 100%)', hint: '아이스크림 위 에스프레소' },
	cold_brew: { emoji: '🧊', gradient: 'linear-gradient(135deg, #2a1810 0%, #0c0805 100%)', hint: '저온 장시간 침출' },
	iced_americano: { emoji: '🥤', gradient: 'linear-gradient(135deg, #5d3a23 0%, #1a0e07 100%)', hint: '얼음 + 에스프레소 + 물' },
	dalgona: { emoji: '🍯', gradient: 'linear-gradient(135deg, #f5d49a 0%, #c08443 100%)', hint: '커피 휘핑크림이 얹힌 우유' }
};
