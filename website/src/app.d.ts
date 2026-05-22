// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- ambient Cloudflare worker types (Env)
/// <reference path="../worker-configuration.d.ts" />

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
