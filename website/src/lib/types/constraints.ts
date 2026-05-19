import type { BrewMethod } from './brew';
import type { MenuCategory, MilkType, AromaType, SyrupType } from './menu';

/**
 * 사용자가 채팅으로 누적한 제약 조건. 서버와 클라이언트 모두 이 타입을 공유한다.
 */
export interface Constraints {
	exclude_brew_method?: BrewMethod[];
	milk_type?: MilkType;
	exclude_milk?: boolean;
	exclude_aroma?: AromaType[];
	exclude_syrup?: SyrupType[];
	iced_only?: boolean;
	hot_only?: boolean;
	category_only?: MenuCategory[];
	max_budget_krw?: number;
}
