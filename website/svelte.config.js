import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// CSP — nonce 기반. SvelteKit이 인라인 스크립트/스타일에 자동으로 nonce 를 주입한다.
		// Pretendard CDN(jsDelivr)을 style-src 에 명시적으로 허용한다.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'https://cdn.jsdelivr.net'],
				'font-src': ['self', 'https://cdn.jsdelivr.net', 'data:'],
				'img-src': ['self', 'data:'],
				'connect-src': ['self'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		},
		// SvelteKit 기본 CSRF 보호 — form-encoded 요청은 same-origin 만 허용.
		// JSON 엔드포인트는 requireSameOrigin() 로 별도 가드한다.
		// trustedOrigins 를 비워 외부 origin 의 form 제출을 모두 차단.
		csrf: {
			trustedOrigins: []
		}
	}
};

export default config;
