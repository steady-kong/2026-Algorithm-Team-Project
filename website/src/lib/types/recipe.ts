import type { BrewMethod } from './brew';
import type {
	MenuCategory,
	MilkType,
	MilkTreatment,
	SyrupType,
	AromaType,
	ToppingType,
	Temperature
} from './menu';

export type GrindSize =
	| 'extra-fine'
	| 'fine'
	| 'medium-fine'
	| 'medium'
	| 'medium-coarse'
	| 'coarse';

export const GRIND_ORDER: readonly GrindSize[] = [
	'extra-fine',
	'fine',
	'medium-fine',
	'medium',
	'medium-coarse',
	'coarse'
];

export const GRIND_LABELS: Record<GrindSize, string> = {
	'extra-fine': '아주 곱게',
	fine: '곱게',
	'medium-fine': '중간보다 곱게',
	medium: '중간',
	'medium-coarse': '중간보다 굵게',
	coarse: '굵게'
};

export interface RecipeStep {
	order: number;
	description: string;
	duration_sec: number | null;
}

/**
 * 원두 추천 힌트. 추출 변수(컵 프로파일) 위에 *어떤 원두로 내려야 하는지* 자연어로 안내한다.
 *
 * 두 가지 입력 경로 — (1) 라이브러리 항목이 자기 시그니처 원두를 들고 있으면 그걸 사용,
 * (2) 없으면 메뉴 카테고리 디폴트(`bean-hints.ts`)로 폴백. info.md §1.2 산지 표 + §2.2
 * 로스트가 5축에 미치는 영향을 근거로 매핑.
 */
/** 로스트 단계 화이트리스트 — info.md §2.1 의 3단 축약. */
export const ROAST_LEVELS = ['light', 'medium', 'dark'] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export interface BeanHint {
	/** 산지·가공 한 줄 (예: "에티오피아 예가체프 워시드", "브라질 세하도 + 콜롬비아 블렌드"). */
	origin: string;
	/** 로스트 단계 — info.md §2.1 의 3단 축약. */
	roast: RoastLevel;
	/** 대표 풍미 노트 1~3개 (예: ["블루베리", "다크초콜릿"]). */
	notes: readonly string[];
	/** 한 줄 설명 — 왜 이 메뉴에 이 원두가 어울리는지. */
	rationale?: string;
}

export interface Recipe {
	brew_method: BrewMethod;
	grind_size: GrindSize;
	dose_g: number;
	water_g: number;
	water_temp_c: number;
	bloom_sec: number | null;
	total_time_sec: number;
	steps: RecipeStep[];
	score: number;
	notes: string;
	/** 예상 컵 프로파일 (산미/바디/단맛/쓴맛, 1~5 정수). 별점 차이 표시용. */
	predicted_cup: { acidity: number; body: number; sweetness: number; bitterness: number };

	// ─ 메뉴 확장 (모두 선택적) ─
	menu_category?: MenuCategory;
	milk_type?: MilkType;
	milk_treatment?: MilkTreatment;
	syrups?: SyrupType[];
	aroma?: AromaType;
	topping?: ToppingType;
	non_dairy_creamer?: boolean;
	temperature?: Temperature;
	/**
	 * 화면에 그대로 노출할 메뉴 이름 (예: "펌킨 크림 콜드브루"). 카테고리 라벨
	 * (예: "콜드브루") 만으로는 충분하지 않은 라이브러리/조합/변형 메뉴 식별용.
	 */
	display_name?: string;
	/** 추천 원두 산지·로스트·풍미 노트. info.md 의 산지/로스트 매핑을 컵 단위로 굳혀 응답에 동봉. */
	bean_hint?: BeanHint;
}

export interface RecipeGenerateResponse {
	best: Recipe;
	alternatives: Recipe[];
}
