import { type BrewMethod } from '$lib/types/brew';

/**
 * 메시지가 콜드브루를 명시 요청하는가. "콜드브루 말고" 같은 배제 맥락이면 false —
 * 콜드브루는 침지식이라 비요청 맥락에서 드립/에스프레소 변주에 섞이면 안 된다(propose·refine 공용 게이트).
 */
export function mentionsColdBrew(message: string): boolean {
	if (/(말고|말구|빼고|빼|제외|싫|아니)/.test(message)) return false;
	return /콜드\s*브루|cold\s*brew/i.test(message);
}

/**
 * 메시지에 커피·음료·맛 취향 등 도메인 신호가 하나라도 있는가.
 * off-topic 게이트의 결정적 1차 통과용 — 명확한 신호가 있으면 LLM 분류를 건너뛰고 정상 요청으로 본다.
 * 신호가 없으면 off-topic 후보이므로 호출부에서 LLM 으로 재확인한다. 모호한 단음절은 오탐을 피해 제외.
 */
export function isCoffeeRelevant(message: string): boolean {
	return /커피|카페|원두|에스프레소|샷|라떼|아메리카노|카푸치노|카푸|마키아토|꼬르타도|코르타도|아포가토|아인슈페너|달고나|모카|콜드\s*브루|플랫\s*화이트|푸어\s*오버|프렌치\s*프레스|에어로\s*프레스|모카\s*포트|드립|음료|시럽|로스(?:트|팅)|디카페인|달콤|단맛|쓴맛|산미|새콤|고소|묵직|진하|부드럽|부드러|크리미|깔끔|상큼|바디감|풍미|coffee|espresso|latte|americano|cappuccino|macchiato|cortado|affogato|mocha|cold\s*brew|flat\s*white|dalgona|drip|pour[\s-]*over|french[\s-]*press|aeropress|moka|decaf|caffeine|\bbean|roast|syrup|aroma/i.test(
		message
	);
}

/**
 * 메시지에서 추출 기구 의도를 감지한다 (드립/푸어오버/프렌치프레스 등).
 *
 * - propose: LLM 후보 점수화 시 의도와 다른 기구를 감점(M4 우유 가점과 같은 결).
 * - refine: 기구 전환 요청을 양성 brew_method 타깃으로 회수(M1).
 *
 * "드립 말고" 같은 배제 맥락이면 양성 의도가 아니므로 null.
 */
export function detectBrewIntent(message: string): BrewMethod | null {
	const m = message;
	if (/(말고|말구|빼고|빼|제외|싫|아니)/.test(m)) return null;
	if (
		/(핸드\s*드립|드립\s*커피|드립으로|드립\s*형태|드립|푸어\s*오버|푸어오버|pour[\s-]*over|hand[\s-]*drip|filter\s+coffee)/i.test(
			m
		)
	)
		return 'hand_drip';
	if (/(프렌치\s*프레스|french[\s-]*press)/i.test(m)) return 'french_press';
	if (/(에어로\s*프레스|aeropress|aero[\s-]*press)/i.test(m)) return 'aeropress';
	if (/(모카\s*포트|moka[\s-]*pot)/i.test(m)) return 'moka_pot';
	// "에스프레소 머신" 외에 "커피 머신/머신/기계", "coffee machine/machine" 도 머신 추출 의도로 본다
	// — 이 문구들이 빠져 있어 "커피 머신으로 내려줘" 가 감지 안 돼 콜드브루가 끼던 문제.
	if (
		/(에스프레소\s*머신|espresso\s*machine|커피\s*(?:머신|기계)|coffee\s*machine|머신|기계|\bmachine\b)/i.test(
			m
		)
	)
		return 'espresso_machine';
	return null;
}
