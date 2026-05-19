import type { Recipe } from './recipe';
import type { TasteProfile } from './taste';
import type { Constraints } from './constraints';

export interface Proposal {
	id: string;
	name: string;
	tagline: string;
	recipe: Recipe;
	/**
	 * 라이브러리에서 영감을 받은 항목들. 한 개면 "그대로 추천", 두 개 이상이면
	 * 특징을 조합한 하이브리드. 클라이언트는 "✨ A + B 영감" 같은 배지로 표시.
	 */
	inspired_by?: { id: string; name: string }[];
	/**
	 * refine 응답 전용 표지. 'mod' = 사용자가 고른 메뉴를 살짝 변형 (휘핑 추가 등),
	 * 'alt' = 같은 의도에 맞는 다른 메뉴. 카드 배지로 노출.
	 */
	kind?: 'mod' | 'alt';
}

export type ChatRole = 'user' | 'assistant';

export type ChatMessage =
	| { kind: 'text'; role: ChatRole; text: string }
	| { kind: 'proposals'; role: 'assistant'; proposals: Proposal[]; chosenId: string | null }
	| { kind: 'recipe'; role: 'assistant'; recipe: Recipe }
	| { kind: 'error'; role: 'assistant'; text: string };

export interface ChatContext {
	profile: TasteProfile | null;
	constraints: Constraints;
}

/** 서버로 보내는 최소 메시지 (text/role 만). 너무 길어지지 않게 클라가 줄여서 전송. */
export interface TurnLite {
	role: ChatRole;
	text: string;
}
