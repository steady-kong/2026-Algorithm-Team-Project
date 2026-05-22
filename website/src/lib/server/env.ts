import { env as privEnv } from '$env/dynamic/private';
import type { UpstageEnv } from './upstage';

/**
 * Read Upstage config from wherever it lives:
 *  - production / `vite dev` with the Cloudflare platform proxy → `platform.env`
 *    (this is where `.dev.vars` and `wrangler secret`s surface)
 *  - plain Vite dotenv (`.env`) → `$env/dynamic/private`
 * platform.env wins so `.dev.vars` / real secrets take precedence.
 */
export function readUpstageEnv(platform: App.Platform | undefined): UpstageEnv {
	const penv = (platform?.env ?? {}) as Record<string, string | undefined>;
	return {
		UPSTAGE_API_KEY: penv.UPSTAGE_API_KEY ?? privEnv.UPSTAGE_API_KEY,
		UPSTAGE_MODEL: penv.UPSTAGE_MODEL ?? privEnv.UPSTAGE_MODEL
	};
}
