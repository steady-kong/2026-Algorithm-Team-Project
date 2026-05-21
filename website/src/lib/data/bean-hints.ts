/**
 * 메뉴 카테고리·온도 → 추천 원두 힌트 결정적 매핑.
 *
 * info.md §1.2 (산지별 풍미 프로파일) · §2.2 (로스트가 5축에 미치는 영향) · §8.2 (자연어 →
 * 5축 + 추천 카테고리) 의 권고를 압축한다. 라이브러리 항목이 자기 `bean_hint` 를 직접
 * 들고 있으면 그걸 우선 사용하고, 없을 때만 이 디폴트가 메워진다.
 *
 * 매핑 원칙
 *  - 블랙(필터): 산지 풍미가 가장 또렷 → 라이트 로스트 + 위시드 에티오피아·콜롬비아.
 *  - 우유 음료(라떼·카푸치노·플랫화이트·꼬르타도): 미디엄~다크 브라질·콜롬비아 — 초콜릿
 *    바디가 우유에 묻히지 않음.
 *  - 모카·아이스아메리카노·아포가토: 다크 — 초콜릿/얼음/시럽 위에서 묵직함이 살아남게.
 *  - 콜드브루: 미디엄~다크 브라질 — 저온 침지로 산미↓·단맛↑ 둥글게.
 *  - 달고나: 인스턴트 — 카테고리 자체가 인스턴트 베이스라 산지 추천이 의미 없음.
 */

import type { BeanHint } from '../types/recipe';
import type { MenuCategory, Temperature } from '../types/menu';

const ETHIOPIA_WASHED: BeanHint = {
	origin: '에티오피아 예가체프 워시드',
	roast: 'light',
	notes: ['자스민', '베르가못', '레몬'],
	rationale: '산지 특성이 가장 또렷이 살아나도록 라이트 로스트 + 워시드 가공.'
};

const COLOMBIA_MEDIUM: BeanHint = {
	origin: '콜롬비아 우일라',
	roast: 'medium',
	notes: ['밀크초콜릿', '캐러멜', '견과류'],
	rationale: '균형형 산지 — 산미·단맛·바디가 1순위 후보.'
};

const BRAZIL_MEDIUM_DARK: BeanHint = {
	origin: '브라질 세하도',
	roast: 'dark',
	notes: ['다크초콜릿', '땅콩', '캐러멜'],
	rationale: '낮은 산미·풀바디 — 우유·시럽·얼음 너머로도 묵직함이 살아남는 에스프레소 베이스.'
};

const BRAZIL_COLOMBIA_BLEND: BeanHint = {
	origin: '브라질 + 콜롬비아 블렌드',
	roast: 'medium',
	notes: ['초콜릿', '견과류', '캐러멜'],
	rationale: '브라질의 바디 + 콜롬비아의 단맛 — 우유와 어우러지는 클래식 에스프레소 블렌드.'
};

const COLOMBIA_DARK: BeanHint = {
	origin: '콜롬비아 우일라 다크 로스트',
	roast: 'dark',
	notes: ['다크초콜릿', '캐러멜', '로스티드넛'],
	rationale: '카카오 노트를 끌어올린 다크 로스트 — 초콜릿 시럽 위에서도 또렷.'
};

const GUATEMALA_MEDIUM: BeanHint = {
	origin: '과테말라 안티구아',
	roast: 'medium',
	notes: ['코코아', '오렌지', '스모키'],
	rationale: '화산토 특유의 향신감 — 두꺼운 폼·꼬르타도 잔에서 향이 도드라짐.'
};

const DALGONA_INSTANT: BeanHint = {
	origin: '인스턴트 커피 (한국식)',
	roast: 'dark',
	notes: ['로스티드', '단맛'],
	rationale: '달고나는 인스턴트커피·설탕·물 1:1:1 휘핑이 정체성 — 산지 추천 영역 밖.'
};

const CATEGORY_DEFAULTS: Record<MenuCategory, BeanHint> = {
	black: ETHIOPIA_WASHED,
	latte: BRAZIL_COLOMBIA_BLEND,
	cappuccino: COLOMBIA_MEDIUM,
	flat_white: BRAZIL_MEDIUM_DARK,
	mocha: COLOMBIA_DARK,
	macchiato: BRAZIL_MEDIUM_DARK,
	cortado: GUATEMALA_MEDIUM,
	affogato: BRAZIL_MEDIUM_DARK,
	cold_brew: BRAZIL_MEDIUM_DARK,
	iced_americano: BRAZIL_COLOMBIA_BLEND,
	dalgona: DALGONA_INSTANT
};

const ICED_BLACK_OVERRIDE: BeanHint = {
	origin: '에티오피아 시다모 내추럴',
	roast: 'light',
	notes: ['블루베리', '와인', '다크초콜릿'],
	rationale: '아이스 블랙은 산미·과일성이 두드러져 — 내추럴 라이트 로스트가 가장 화사.'
};

/** 카테고리(+온도)에 어울리는 디폴트 원두 힌트. */
export function defaultBeanHintForCategory(
	category: MenuCategory,
	temperature: Temperature = 'hot'
): BeanHint {
	if (category === 'black' && temperature === 'iced') return ICED_BLACK_OVERRIDE;
	return CATEGORY_DEFAULTS[category];
}

/** info.md §2.1 의 영문 단계명 ↔ 한국어 단어 매핑. UI 표시용. */
export const ROAST_LABELS: Record<BeanHint['roast'], { ko: string; en: string }> = {
	light: { ko: '라이트 로스트', en: 'light roast' },
	medium: { ko: '미디엄 로스트', en: 'medium roast' },
	dark: { ko: '다크 로스트', en: 'dark roast' }
};
