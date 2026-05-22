import type { CoffeeRecipe } from '$lib/types/recipe';

/**
 * Seed catalog. Two jobs:
 *  1) deterministic fallback when no Upstage key is configured (or the LLM fails);
 *  2) grounding examples handed to the LLM so its generated candidates stay realistic.
 *
 * Profiles are on the 1–5 grid: acidity / sweetness / bitterness / body.
 * `cost` is relative price units; `effort` is brew difficulty (1 easy – 5 fussy).
 */
export const RECIPES: CoffeeRecipe[] = [
	{
		id: 'ethiopia-pourover',
		name: 'Yirgacheffe Pour-over',
		nameKo: '예가체프 핸드드립',
		bean: { origin: '에티오피아 예가체프', roast: 'light' },
		method: 'pour_over',
		profile: { acidity: 5, sweetness: 3, bitterness: 1, body: 2 },
		cost: 5,
		effort: 4,
		brewTimeMin: 4,
		steps: ['92°C 물 준비', '20g 원두 중간 분쇄', '40g로 30초 뜸들이기', '3회 나눠 300g까지 푸어'],
		story: '예가체프는 자스민·레몬 같은 화사한 산미로 유명해요.'
	},
	{
		id: 'kenya-pourover',
		name: 'Kenya AA Pour-over',
		nameKo: '케냐 AA 핸드드립',
		bean: { origin: '케냐 니에리', roast: 'light' },
		method: 'pour_over',
		profile: { acidity: 5, sweetness: 4, bitterness: 2, body: 3 },
		cost: 6,
		effort: 4,
		brewTimeMin: 4,
		steps: ['94°C 물', '18g 원두', '블랙커런트 향을 살리려 천천히 푸어'],
		story: '케냐는 블랙커런트 같은 진한 베리 산미와 단맛이 특징이에요.'
	},
	{
		id: 'colombia-aeropress',
		name: 'Colombia Aeropress',
		nameKo: '콜롬비아 에어로프레스',
		bean: { origin: '콜롬비아 우일라', roast: 'medium' },
		method: 'aeropress',
		profile: { acidity: 3, sweetness: 4, bitterness: 2, body: 3 },
		cost: 4,
		effort: 2,
		brewTimeMin: 2,
		steps: ['85°C 물', '15g 원두', '1분 침지 후 30초 압출'],
		story: '균형 잡힌 콜롬비아는 입문자에게 가장 무난한 선택이에요.'
	},
	{
		id: 'brazil-frenchpress',
		name: 'Brazil French Press',
		nameKo: '브라질 프렌치프레스',
		bean: { origin: '브라질 세하도', roast: 'medium_dark' },
		method: 'french_press',
		profile: { acidity: 2, sweetness: 4, bitterness: 3, body: 4 },
		cost: 3,
		effort: 1,
		brewTimeMin: 4,
		steps: ['94°C 물', '굵은 분쇄 30g', '4분 침지 후 프레스'],
		story: '브라질은 견과류·초콜릿 뉘앙스에 묵직한 바디가 매력이에요.'
	},
	{
		id: 'guatemala-espresso',
		name: 'Guatemala Espresso',
		nameKo: '과테말라 에스프레소',
		bean: { origin: '과테말라 안티구아', roast: 'medium_dark' },
		method: 'espresso',
		profile: { acidity: 3, sweetness: 3, bitterness: 4, body: 4 },
		cost: 4,
		effort: 3,
		brewTimeMin: 1,
		steps: ['18g 도징', '9bar 추출', '25초 안에 36g'],
		story: '과테말라는 코코아 같은 단맛과 또렷한 산미가 공존해요.'
	},
	{
		id: 'darkblend-espresso',
		name: 'Dark Blend Espresso',
		nameKo: '다크 블렌드 에스프레소',
		bean: { origin: '다크 블렌드', roast: 'dark' },
		method: 'espresso',
		profile: { acidity: 1, sweetness: 2, bitterness: 5, body: 5 },
		cost: 3,
		effort: 3,
		brewTimeMin: 1,
		steps: ['18g 도징', '강하게 탬핑', '진하게 25초 추출'],
		story: '다크 로스트는 스모키하고 강렬한 쓴맛을 좋아하는 분께 추천.'
	},
	{
		id: 'latte-classic',
		name: 'Classic Latte',
		nameKo: '클래식 라떼',
		bean: { origin: '하우스 블렌드', roast: 'medium_dark' },
		method: 'latte',
		profile: { acidity: 1, sweetness: 4, bitterness: 2, body: 4 },
		cost: 5,
		effort: 3,
		brewTimeMin: 3,
		steps: ['에스프레소 1샷', '우유 200ml 60°C 스팀', '벨벳 폼으로 마무리'],
		story: '부드러운 우유 단맛으로 쓴맛을 감싸 누구나 좋아하는 클래식.'
	},
	{
		id: 'oat-latte',
		name: 'Oat Milk Latte',
		nameKo: '오트 라떼',
		bean: { origin: '하우스 블렌드', roast: 'medium' },
		method: 'latte',
		profile: { acidity: 2, sweetness: 5, bitterness: 1, body: 4 },
		cost: 6,
		effort: 3,
		brewTimeMin: 3,
		steps: ['에스프레소 1샷', '오트밀크 스팀', '시럽 없이도 곡물 단맛'],
		story: '오트밀크는 자연스러운 곡물 단맛으로 더 달콤하고 부드러워요.'
	},
	{
		id: 'coldbrew-house',
		name: 'House Cold Brew',
		nameKo: '하우스 콜드브루',
		bean: { origin: '콜롬비아 + 브라질', roast: 'medium_dark' },
		method: 'cold_brew',
		profile: { acidity: 2, sweetness: 3, bitterness: 3, body: 4 },
		cost: 4,
		effort: 1,
		brewTimeMin: 720,
		steps: ['굵은 분쇄 70g : 물 1L', '냉장 12시간 침출', '필터링 후 희석'],
		story: '저온 장시간 추출이라 산미가 낮고 부드러운 단맛이 도드라져요.'
	},
	{
		id: 'coldbrew-ethiopia',
		name: 'Ethiopia Cold Brew',
		nameKo: '에티오피아 콜드브루',
		bean: { origin: '에티오피아 시다모', roast: 'light' },
		method: 'cold_brew',
		profile: { acidity: 3, sweetness: 4, bitterness: 2, body: 3 },
		cost: 5,
		effort: 1,
		brewTimeMin: 720,
		steps: ['라이트 로스트 굵은 분쇄', '14시간 냉침', '플로럴 향 유지'],
		story: '라이트 로스트로 콜드브루를 만들면 과일향이 살아 있어요.'
	},
	{
		id: 'moka-strong',
		name: 'Moka Pot Strong',
		nameKo: '모카포트 진하게',
		bean: { origin: '이탈리안 블렌드', roast: 'dark' },
		method: 'moka_pot',
		profile: { acidity: 2, sweetness: 2, bitterness: 5, body: 5 },
		cost: 2,
		effort: 2,
		brewTimeMin: 5,
		steps: ['하단 물 채우기', '바스켓에 분쇄 원두', '약불로 추출'],
		story: '집에서 에스프레소에 가장 가깝게, 진하고 묵직하게.'
	},
	{
		id: 'aeropress-bright',
		name: 'Bright Aeropress',
		nameKo: '산뜻한 에어로프레스',
		bean: { origin: '에티오피아 구지', roast: 'light' },
		method: 'aeropress',
		profile: { acidity: 4, sweetness: 4, bitterness: 1, body: 2 },
		cost: 5,
		effort: 2,
		brewTimeMin: 2,
		steps: ['80°C 낮은 온도', '15g 가는 분쇄', '짧게 침지 후 압출'],
		story: '낮은 온도로 추출해 산뜻한 산미와 단맛만 뽑아냈어요.'
	},
	{
		id: 'flatwhite',
		name: 'Flat White',
		nameKo: '플랫 화이트',
		bean: { origin: '하우스 블렌드', roast: 'medium_dark' },
		method: 'latte',
		profile: { acidity: 2, sweetness: 3, bitterness: 3, body: 4 },
		cost: 5,
		effort: 3,
		brewTimeMin: 3,
		steps: ['리스트레토 2샷', '우유 적게 스팀', '얇은 폼'],
		story: '우유는 적게, 커피 맛은 진하게 — 라떼보다 커피향이 또렷해요.'
	},
	{
		id: 'pourover-balanced',
		name: 'Balanced Pour-over',
		nameKo: '밸런스 핸드드립',
		bean: { origin: '콜롬비아 + 과테말라', roast: 'medium' },
		method: 'pour_over',
		profile: { acidity: 3, sweetness: 3, bitterness: 3, body: 3 },
		cost: 4,
		effort: 3,
		brewTimeMin: 4,
		steps: ['92°C 물', '균형 블렌드 18g', '표준 푸어'],
		story: '모든 축이 중간 — 어떤 취향에서 출발하든 무난한 기준점이에요.'
	},
	{
		id: 'frenchpress-choco',
		name: 'Chocolate French Press',
		nameKo: '초콜릿 프렌치프레스',
		bean: { origin: '브라질 + 콜롬비아', roast: 'dark' },
		method: 'french_press',
		profile: { acidity: 1, sweetness: 3, bitterness: 4, body: 5 },
		cost: 3,
		effort: 1,
		brewTimeMin: 4,
		steps: ['굵은 분쇄', '4분 침지', '천천히 프레스'],
		story: '다크 초콜릿 같은 묵직함과 쓴맛을 좋아한다면 이거예요.'
	},
	{
		id: 'espresso-bright',
		name: 'Bright Single Origin Espresso',
		nameKo: '산미 싱글 에스프레소',
		bean: { origin: '케냐 + 에티오피아', roast: 'medium' },
		method: 'espresso',
		profile: { acidity: 4, sweetness: 3, bitterness: 3, body: 3 },
		cost: 5,
		effort: 4,
		brewTimeMin: 1,
		steps: ['싱글 오리진 18g', '온도 높여 추출', '산미 강조'],
		story: '에스프레소도 산미를 살릴 수 있어요 — 미디엄 싱글 오리진으로.'
	}
];

export function recipeById(id: string): CoffeeRecipe | undefined {
	for (const r of RECIPES) if (r.id === id) return r;
	return undefined;
}
