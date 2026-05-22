# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Morgorithm** (rebuilt from scratch on the `redesign` branch) — an Upstage-AI coffee
recommender. The LLM only *generates* candidate data (target taste + candidate recipes);
hand-written algorithms do all the *ranking and selection*. Works fully **without an API
key** via a deterministic rule-based fallback (`source: "rules"` in API responses).

Pipeline: free-text craving → (Upstage Solar JSON **or** rule fallback) target profile +
candidates → similarity scoring → merge sort → greedy diversify (top 3) → 0/1 knapsack
tasting flight → Dijkstra taste journey. Two pages: `/` (interactive recommender) and
`/about` (animated, auto-playing algorithm walkthrough). See `ALGORITHMS.md` at the repo
root for what each algorithm does and where.

Key locations (all under `website/src/`):
- `lib/algorithms/` — pure, tested algorithms (`similarity`, `sort` merge+quick, `search` binary, `greedy`, `knapsack` DP, `graph` Dijkstra+MinHeap, `interpolate`). `algorithms.spec.ts` covers them.
- `lib/server/recommend.ts` — orchestration (LLM-generate → algorithm-rank); `upstage.ts` (Solar client), `parse.ts` (rule fallback + LLM-output validation).
- `lib/data/recipes.ts` — seed catalog (fallback + grounding + the Dijkstra graph nodes).
- `routes/api/{recommend,refine}/+server.ts` — endpoints; `lib/stores/session.svelte.ts` — client state (localStorage, 24h TTL).
- `lib/components/` + `components/demos/` — UI and the about-page animations.

The old pre-rebuild app + a Python prototype under `skeleton/` live in git history only —
ignore them.

### Upstage LLM (optional)

No key needed to run. To enable the LLM path, put `UPSTAGE_API_KEY="..."` in
`website/.dev.vars` (model defaults to `solar-pro3`, override with `UPSTAGE_MODEL`). The
client is plain `fetch` against the OpenAI-compatible endpoint with a 12s timeout; any
failure falls back to rules.

## Where the code lives

Everything runs inside **`website/`**. Run all npm/build commands from there, not the
repo root. There is a second `CLAUDE.md` in `website/` carrying Svelte MCP tooling
instructions (use `list-sections` / `get-documentation` / `svelte-autofixer` when
writing Svelte) — it loads automatically when working in that directory.

## Stack

- **SvelteKit 2 + Svelte 5** — runes mode is force-enabled for all project files (see `svelte.config.js`); write `$state`/`$derived`/`$props`, not legacy reactive syntax.
- **TypeScript** strict.
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js`; configure with `@theme` in CSS).
- **Cloudflare Workers/Pages** target via `@sveltejs/adapter-cloudflare` (configured in `svelte.config.js`).
- **No auth / no database.** The scaffolding's better-auth + Drizzle/D1 + GitHub OAuth were removed — the recommender is stateless server-side and keeps session state in `localStorage` (24h TTL). There is no login and `hooks.server.ts` no longer exists.
- **Vitest** with two projects: `client` (browser, Playwright/chromium, matches `*.svelte.{test,spec}.ts`) and `server` (node, everything else). `requireAssertions` is on — every test must assert.

## Commands

Run from `website/`:

```bash
npm run dev            # vite dev server (port 5173)
npm run build          # vite build (Cloudflare adapter output)
npm run deploy         # vite build + wrangler deploy
npm run check          # svelte-check — see Node version note below
npm run lint           # eslint
npm run test           # vitest --run (both client + server projects)
npm run test:unit      # vitest (watch)
```

Single test: `npm run test:unit -- --run path/to/file.spec.ts` (add `-t "name"` to filter
by test name; pass `--project server` or `--project client` to pick one project).

### Node version (important)

`svelte-check` and the dev server need Node 20+. This machine defaults to Node 18 in
PATH, which makes `npm run check` die with `File is not defined` (an `undici` failure,
unrelated to the code). Force Node 24:

```bash
cd website && PATH=/usr/local/bin:$PATH npm run check
```

`/usr/local/bin/node` is v24; `/usr/bin/node` is v18.

### Verification on this machine (low memory)

This is a WSL2 box with ~3.7 GB RAM. Run `check` / `lint` / `build` **one at a time, never
chained** — `npm run check && npm run lint && npm run build` OOM-kills (exit 137).
`npm run test` is light. Kill stray dev servers with `pkill -f "vite dev"` after smoke tests.

## How the Upstage key is read

`src/lib/server/env.ts` (`readUpstageEnv`) reads the key from `platform.env` first
(Cloudflare secret / `.dev.vars` via the adapter's dev platform proxy), then falls back to
`$env/dynamic/private` (`.env`). The API routes pass `readUpstageEnv(platform)` into the
recommender. No key → deterministic rule fallback (`source: "rules"`).
