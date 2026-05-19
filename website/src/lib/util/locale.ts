/**
 * 입력 언어 감지 + LLM 시스템 프롬프트용 언어 지시 ([fix.md #13](../../../../fix.md)).
 *
 * 범위는 의도적으로 좁다 — `ko` (기본) / `en` 두 가지만. 사용 빈도가 가장 높은 두 언어를
 * 커버해, 영어로 말 건 사용자에게 한국어로 답하는 위화감을 없애는 게 목표.
 *
 * 다른 언어(일/중/스페인어 등)는 한글 비포함 + 라틴 알파벳 비포함이라 둘 다 false →
 * `ko` 기본값으로 떨어진다. 본격 다국어는 별도 i18n 시스템 도입 시 확장.
 */

export type Locale = 'ko' | 'en';

const HANGUL_RE = /[가-힣ㄱ-ㅎㅏ-ㅣ]/;
const LATIN_RE = /[a-zA-Z]/;

/**
 * 사용자 텍스트의 주 사용 언어를 추정한다.
 *
 * 한글 1자라도 있으면 `ko` — 한국어 사용자가 영단어를 섞어 쓰는 경우(예: "iced 라떼")가
 * 흔하므로 한글 우선 매칭이 안전. 한글 0자 + 라틴 알파벳 1자 이상이면 `en`. 그 외 모두 `ko`.
 */
export function detectLocale(text: string): Locale {
	if (typeof text !== 'string' || text.length === 0) return 'ko';
	if (HANGUL_RE.test(text)) return 'ko';
	if (LATIN_RE.test(text)) return 'en';
	return 'ko';
}

/**
 * 시스템 프롬프트 앞에 붙이는 언어 지시문. 한국어 기본 톤은 유지하되, EN 인 경우 영어로 답하라고
 * 명시. 양쪽 모두 JSON 스키마는 동일하게 유지하라고 못 박는다 (자유 텍스트만 언어 전환).
 *
 * 길고 한국어 본문으로 가득한 시스템 프롬프트에서 마지막 한 줄 지시는 종종 무시된다 — 그래서
 * 이 directive 는 호출부에서 **system prompt 의 가장 앞쪽**에 prepend 해서 모델의 attention 을
 * 받기 쉽게 한다.
 */
export function languageDirective(locale: Locale): string {
	if (locale === 'en') {
		return (
			'## CRITICAL — Output Language: English (HARD REQUIREMENT)\n' +
			'The user wrote in English. EVERY free-form text field you produce — `assistant`, ' +
			'`assistant_text`, `tagline`, `name`, `description` — MUST be in natural English. ' +
			'Do NOT output any Korean prose, Korean punctuation, or transliterated Korean menu names ' +
			'(no "바닐라 라떼" — use "Vanilla Latte" instead). Even when inspired by a Korean-named ' +
			'library entry, translate the name into its natural English equivalent. ' +
			'JSON keys, enum values, and library ids stay exactly as specified.\n\n'
		);
	}
	return '';
}
