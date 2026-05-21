import { type BrewMethod } from '$lib/types/brew';

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
	if (/(에스프레소\s*머신|espresso\s*machine)/i.test(m)) return 'espresso_machine';
	return null;
}
