// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
        interface Platform {
            env: Env;
            cf: CfProperties;
            ctx: ExecutionContext;
        }
    }

    // 추천 엔진 선택 바인딩 — 운영(Cloudflare)에서만 존재하고 dev/미생성 환경엔 없을 수 있어
    // optional 로 둔다(engine/bindings.ts 가 방어적으로 읽고 graceful degrade). KVNamespace /
    // D1Database 타입은 worker-configuration.d.ts(@cloudflare/workers-types)에서 전역 제공.
    interface Env {
        COFFEE_CACHE?: KVNamespace;
        COFFEE_DB?: D1Database;
    }
}

export {};