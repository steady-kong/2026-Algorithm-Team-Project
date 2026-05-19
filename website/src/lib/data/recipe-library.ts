/**
 * 레시피 라이브러리 — 알려진 카페 메뉴 카탈로그.
 *
 * LLM 이 이 라이브러리를 참고해 (1) 그대로 추천하거나 (2) 여러 항목의
 * 특징을 조합해 하이브리드 메뉴를 만들 수 있게 한다.
 *
 * 출처: A Beautiful Mess 의 "40+ Coffee Recipes" 큐레이션 + 내부 프리셋.
 * 각 항목은 우리 화이트리스트(enum) 값으로 정규화되어 있으므로 LLM 응답을
 * 그대로 attachCategory() 로 흘려보내도 안전하다.
 *
 * 태그 카테고리:
 *   - flavor: sweet / bitter / sour / smoky / nutty / chocolate / vanilla / spicy / fruity
 *   - texture: creamy / foamy / smooth / watery / thick
 *   - vibe: classic / cozy / refreshing / indulgent / seasonal / exotic / minimal / bold
 *   - strength: light / mild / strong
 *   - extra: vegan_friendly, dessert_like, breakfast 등
 */

import type { BrewMethod } from '../types/brew';
import type {
	MenuCategory,
	MilkType,
	AromaType,
	SyrupType,
	Temperature
} from '../types/menu';
import type { BeanHint } from '../types/recipe';

export interface RecipeEntry {
	id: string;
	name: string;
	english?: string;
	description: string;
	features: {
		category: MenuCategory;
		brew_method: BrewMethod;
		milk_type: MilkType;
		aroma: AromaType;
		syrups: SyrupType[];
		temperature: Temperature;
		tags: readonly string[];
		/** 시그니처 원두 힌트. 없으면 `bean-hints.ts` 의 카테고리 디폴트로 폴백. */
		bean_hint?: BeanHint;
	};
}

export const RECIPE_LIBRARY: readonly RecipeEntry[] = [
	// ── 클래식 ────────────────────────────────────────────
	{
		id: 'r-latte',
		name: '카페라떼',
		english: 'Latte',
		description: '에스프레소 위 부드러운 스팀 우유의 균형감.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'creamy', 'mild']
		}
	},
	{
		id: 'r-cappuccino',
		name: '카푸치노',
		english: 'Cappuccino',
		description: '에스프레소·스팀 우유·풍성한 거품 1:1:1 의 정통 이탈리아식.',
		features: {
			category: 'cappuccino',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'foamy', 'mild']
		}
	},
	{
		id: 'r-flatwhite',
		name: '플랫화이트',
		english: 'Flat White',
		description: '에스프레소와 마이크로폼 우유 단 두 가지의 진한 한 잔.',
		features: {
			category: 'flat_white',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'creamy', 'strong', 'minimal']
		}
	},
	{
		id: 'r-cortado',
		name: '꼬르타도',
		english: 'Cortado',
		description: '에스프레소와 우유를 1:1 로 합친 묵직하고 균형 잡힌 한 잔.',
		features: {
			category: 'cortado',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'strong', 'minimal']
		}
	},
	{
		id: 'r-macchiato',
		name: '마키아토',
		english: 'Macchiato',
		description: '에스프레소에 우유 거품 한 점만 살짝 올린 진한 베이스.',
		features: {
			category: 'macchiato',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'strong', 'bitter']
		}
	},
	{
		id: 'r-cafe-au-lait',
		name: '카페오레',
		english: 'Café au Lait',
		description: '드립 커피와 데운 우유를 부드럽게 섞은 프렌치 클래식.',
		features: {
			category: 'latte',
			brew_method: 'hand_drip',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'creamy', 'mild', 'breakfast'],
			bean_hint: {
				origin: '콜롬비아 우일라 · 미디엄 로스트',
				roast: 'medium',
				notes: ['밀크초콜릿', '캐러멜', '견과류'],
				rationale: '드립 베이스라 우유와 어우러지면서도 산지 향이 살짝 남아야 — 균형형 미디엄.'
			}
		}
	},
	{
		id: 'r-cafe-con-leche',
		name: '카페콘레체',
		english: 'Café con Leche',
		description: '진한 커피와 따뜻한 우유의 스페인식 만남.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'creamy', 'strong']
		}
	},
	{
		id: 'r-handdrip',
		name: '핸드드립 블랙',
		english: 'Pour-Over (Chemex/V60)',
		description: '원두 본연의 향과 산미를 그대로 살린 깔끔한 한 잔.',
		features: {
			category: 'black',
			brew_method: 'hand_drip',
			milk_type: 'none',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['classic', 'minimal', 'sour', 'light'],
			bean_hint: {
				origin: '에티오피아 예가체프 워시드',
				roast: 'light',
				notes: ['자스민', '베르가못', '레몬'],
				rationale: '핸드드립은 산지 풍미가 가장 또렷 — 워시드 라이트가 향과 산미를 그대로 들어올림.'
			}
		}
	},
	{
		id: 'r-aeropress',
		name: '에어로프레스 블랙',
		english: 'Aeropress',
		description: '가압 추출로 깔끔하고 균형 잡힌 한 잔.',
		features: {
			category: 'black',
			brew_method: 'aeropress',
			milk_type: 'none',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['minimal', 'mild', 'classic'],
			bean_hint: {
				origin: '콜롬비아 우일라',
				roast: 'medium',
				notes: ['밀크초콜릿', '캐러멜', '견과류'],
				rationale: '단시간 가압 추출은 균형형 미디엄이 가장 둥글게 떨어짐.'
			}
		}
	},

	// ── 시원한 / Iced ────────────────────────────────────
	{
		id: 'r-iced-americano',
		name: '아이스 아메리카노',
		english: 'Iced Americano',
		description: '시원하고 깔끔한 기본의 미덕.',
		features: {
			category: 'iced_americano',
			brew_method: 'espresso_machine',
			milk_type: 'none',
			aroma: 'none',
			syrups: [],
			temperature: 'iced',
			tags: ['classic', 'refreshing', 'bitter', 'minimal']
		}
	},
	{
		id: 'r-cold-brew',
		name: '콜드브루',
		english: 'Cold Brew',
		description: '오래 우려낸 깔끔하고 부드러운 단맛.',
		features: {
			category: 'cold_brew',
			brew_method: 'french_press',
			milk_type: 'none',
			aroma: 'none',
			syrups: [],
			temperature: 'iced',
			tags: ['refreshing', 'smooth', 'sweet', 'mild']
		}
	},
	{
		id: 'r-iced-latte',
		name: '아이스 라떼',
		english: 'Iced Latte',
		description: '에스프레소와 차가운 우유, 얼음의 부드러운 조합.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'iced',
			tags: ['refreshing', 'creamy', 'mild']
		}
	},
	{
		id: 'r-iced-mocha',
		name: '아이스 모카',
		english: 'Iced Mocha',
		description: '얼음 위 초콜릿과 우유, 에스프레소의 시원한 클래식.',
		features: {
			category: 'mocha',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'chocolate',
			syrups: [],
			temperature: 'iced',
			tags: ['refreshing', 'chocolate', 'sweet', 'indulgent']
		}
	},
	{
		id: 'r-oat-cold-brew',
		name: '오트 콜드브루',
		english: 'Oat Milk Cold Brew',
		description: '오트 우유로 부드럽게 마시는 콜드브루.',
		features: {
			category: 'cold_brew',
			brew_method: 'french_press',
			milk_type: 'oat',
			aroma: 'none',
			syrups: [],
			temperature: 'iced',
			tags: ['refreshing', 'creamy', 'vegan_friendly', 'mild']
		}
	},
	{
		id: 'r-pumpkin-cold-brew',
		name: '펌킨 크림 콜드브루',
		english: 'Pumpkin Cream Cold Brew',
		description: '시나몬 향 콜드폼이 얹힌 가을 한정 콜드브루.',
		features: {
			category: 'cold_brew',
			brew_method: 'french_press',
			milk_type: 'whole',
			aroma: 'cinnamon',
			syrups: ['caramel'],
			temperature: 'iced',
			tags: ['seasonal', 'sweet', 'creamy', 'spicy']
		}
	},

	// ── 향/시럽 변주 ──────────────────────────────────────
	{
		id: 'r-hazelnut-latte',
		name: '헤이즐넛 라떼',
		english: 'Hazelnut Latte',
		description: '달콤한 헤이즐넛 향이 일품인 따뜻한 한 잔.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'hazelnut',
			syrups: ['hazelnut'],
			temperature: 'hot',
			tags: ['sweet', 'nutty', 'creamy']
		}
	},
	{
		id: 'r-vanilla-coldfoam-latte',
		name: '바닐라 콜드폼 라떼',
		english: 'Vanilla Cold Foam Latte',
		description: '부드러운 바닐라 콜드폼이 인상적인 시원한 라떼.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'vanilla',
			syrups: ['vanilla'],
			temperature: 'iced',
			tags: ['sweet', 'vanilla', 'creamy', 'refreshing']
		}
	},
	{
		id: 'r-caramel-macchiato',
		name: '카라멜 마키아토',
		english: 'Caramel Macchiato',
		description: '바닐라와 카라멜이 어우러진 클래식 카페 음료.',
		features: {
			category: 'macchiato',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'vanilla',
			syrups: ['caramel', 'vanilla'],
			temperature: 'hot',
			tags: ['sweet', 'vanilla', 'indulgent']
		}
	},
	{
		id: 'r-cinnamon-latte',
		name: '시나몬 라떼',
		english: 'Cinnamon Latte',
		description: '따뜻한 시나몬 향이 우유 위에 살포시.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'cinnamon',
			syrups: [],
			temperature: 'hot',
			tags: ['spicy', 'cozy', 'mild']
		}
	},

	// ── 모카 계열 ─────────────────────────────────────────
	{
		id: 'r-mocha',
		name: '카페모카',
		english: 'Mocha',
		description: '진한 초콜릿과 우유가 어우러진 달콤한 클래식.',
		features: {
			category: 'mocha',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'chocolate',
			syrups: [],
			temperature: 'hot',
			tags: ['sweet', 'chocolate', 'indulgent'],
			bean_hint: {
				origin: '콜롬비아 + 브라질 다크 블렌드',
				roast: 'dark',
				notes: ['다크초콜릿', '캐러멜', '로스티드넛'],
				rationale: '초콜릿 시럽 위에서 묻히지 않도록 카카오 노트가 강한 다크 블렌드.'
			}
		}
	},
	{
		id: 'r-peppermint-mocha',
		name: '페퍼민트 모카',
		english: 'Peppermint Mocha',
		description: '핫초코와 페퍼민트가 만난 겨울 한 잔.',
		features: {
			category: 'mocha',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'chocolate',
			syrups: ['mint'],
			temperature: 'hot',
			tags: ['sweet', 'chocolate', 'seasonal', 'indulgent']
		}
	},
	{
		id: 'r-mexican-coffee',
		name: '멕시칸 커피',
		english: 'Mexican Coffee',
		description: '시나몬과 초콜릿이 매력적인 따뜻한 변주.',
		features: {
			category: 'mocha',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'cinnamon',
			syrups: [],
			temperature: 'hot',
			tags: ['spicy', 'chocolate', 'exotic', 'cozy']
		}
	},

	// ── 시즌 한정 ─────────────────────────────────────────
	{
		id: 'r-psl',
		name: '펌킨 스파이스 라떼',
		english: 'Pumpkin Spice Latte',
		description: '가을 시즌 인기의 시나몬·카라멜 라떼.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'cinnamon',
			syrups: ['caramel'],
			temperature: 'hot',
			tags: ['seasonal', 'spicy', 'sweet', 'cozy']
		}
	},
	{
		id: 'r-gingerbread-latte',
		name: '진저브레드 라떼',
		english: 'Gingerbread Latte',
		description: '진저브레드 쿠키 같은 따뜻한 향신감.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'cinnamon',
			syrups: ['caramel', 'vanilla'],
			temperature: 'hot',
			tags: ['seasonal', 'spicy', 'sweet', 'cozy']
		}
	},
	{
		id: 'r-eggnog-latte',
		name: '에그녹 라떼',
		english: 'Eggnog Latte',
		description: '에그녹의 진하고 부드러운 라떼 변주.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'vanilla',
			syrups: ['caramel'],
			temperature: 'hot',
			tags: ['seasonal', 'creamy', 'sweet', 'indulgent']
		}
	},
	{
		id: 'r-apple-crisp',
		name: '사과 시나몬 마키아토',
		english: 'Apple Crisp Macchiato',
		description: '사과·시나몬 향이 어우러진 가을 마키아토.',
		features: {
			category: 'macchiato',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'cinnamon',
			syrups: ['caramel'],
			temperature: 'hot',
			tags: ['seasonal', 'fruity', 'spicy', 'sweet']
		}
	},

	// ── 디저트/특별 ───────────────────────────────────────
	{
		id: 'r-affogato',
		name: '아포가토',
		english: 'Affogato',
		description: '바닐라 아이스크림 위에 뜨거운 에스프레소를 부은 디저트.',
		features: {
			category: 'affogato',
			brew_method: 'espresso_machine',
			milk_type: 'none',
			aroma: 'vanilla',
			syrups: [],
			temperature: 'hot',
			tags: ['indulgent', 'dessert_like', 'sweet', 'vanilla']
		}
	},
	{
		id: 'r-einspanner',
		name: '아인슈페너',
		english: 'Einspänner',
		description: '진한 커피 위 부드러운 크림. 묵직하고 달콤해요.',
		features: {
			category: 'affogato',
			brew_method: 'espresso_machine',
			milk_type: 'none',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['indulgent', 'creamy', 'sweet', 'strong'],
			bean_hint: {
				origin: '이탈리안 다크 블렌드 (브라질·인도)',
				roast: 'dark',
				notes: ['다크초콜릿', '담배', '로스티드넛'],
				rationale: '비엔나 클래식 — 휘핑크림 아래 묵직함이 살아남도록 이탈리안 다크.'
			}
		}
	},
	{
		id: 'r-dalgona',
		name: '달고나 커피',
		english: 'Dalgona Coffee',
		description: '폭신한 거품과 우유의 달콤한 조합.',
		features: {
			category: 'dalgona',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['sweet', 'foamy', 'exotic', 'dessert_like']
		}
	},
	{
		id: 'r-breve',
		name: '브레베',
		english: 'Breve',
		description: '하프 앤 하프로 만든 진하고 풍부한 우유 커피.',
		features: {
			category: 'latte',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'none',
			syrups: [],
			temperature: 'hot',
			tags: ['creamy', 'thick', 'indulgent', 'strong']
		}
	},
	{
		id: 'r-mocha-frappe',
		name: '모카 프라푸치노',
		english: 'Mocha Frappe',
		description: '얼음을 갈아 만든 초콜릿 커피 셰이크.',
		features: {
			category: 'mocha',
			brew_method: 'espresso_machine',
			milk_type: 'whole',
			aroma: 'chocolate',
			syrups: [],
			temperature: 'iced',
			tags: ['refreshing', 'sweet', 'chocolate', 'dessert_like', 'thick']
		}
	}
];

/**
 * LLM 시스템 프롬프트에 주입할 컴팩트 텍스트.
 * 각 줄: [id] 이름: category/milk/aroma+syrups/temp | tags
 */
export function libraryAsPromptText(): string {
	return RECIPE_LIBRARY.map((r) => {
		const f = r.features;
		const syr = f.syrups.length > 0 ? `+syrups[${f.syrups.join(',')}]` : '';
		const aroma = f.aroma !== 'none' ? f.aroma : '-';
		return `[${r.id}] ${r.name}: ${f.category}/${f.milk_type}/${aroma}${syr}/${f.temperature} | ${f.tags.join(',')}`;
	}).join('\n');
}

/** id 로 entry 검색. */
export function findRecipeEntry(id: string): RecipeEntry | undefined {
	return RECIPE_LIBRARY.find((r) => r.id === id);
}

/** 유효한 라이브러리 ID 인지 검증. */
export function isLibraryId(value: unknown): value is string {
	if (typeof value !== 'string') return false;
	return RECIPE_LIBRARY.some((r) => r.id === value);
}
