# BUILD_CHECKPOINT — Storefront Desk (Provisional)

**Status headline (2026-09-21 14:35 EDT):** Pivot from Change Order Desk to Storefront Desk completed in `pivot/smb-redesign-agent`. Full deterministic fixture hero loop runs end to end; schema, approvals, grounding citations, shareable preview, autonomous counteroffer classification, follow-up ceiling, and activity ledger verified. Strict typecheck, 14 automated tests (including `convex-test`), and production Vite build are all green.

**Current accepted state:** Commit `082c371` on `pivot/smb-redesign-agent`, verified with 14 automated tests (unit + convex-test), strict typecheck, and Vite production build.

Concept lock: PROVISIONAL — Storefront Desk (operator-approved pivot 2026-09-21). Strategy and decision brief live in `docs/NAMING.md` and `docs/DEMO.md`.

## Human gates — operator actions (exact steps)

None of these blocks local development or judging in `PROVIDER_MODE=fixture`. In order of urgency:

1. **Convex account + project** — https://dashboard.convex.dev/signup. Run `npx convex login` → `npx convex dev` to connect a remote development deployment. Expected: `.env.local` gains `CONVEX_DEPLOYMENT` + `VITE_CONVEX_URL`.
2. **OpenAI API Key** — Project key on https://platform.openai.com. Set: `npx convex env set OPENAI_API_KEY <key>` and `npx convex env set PROVIDER_MODE live`.
3. **Google Places API Key** — Google Cloud Console (Places API New). Set: `npx convex env set GOOGLE_PLACES_API_KEY <key>`.
4. **Firecrawl API Key** — https://www.firecrawl.dev. Set: `npx convex env set FIRECRAWL_API_KEY <key>`.
5. **AgentMail API Key & Inbox** — https://console.agentmail.to. Set: `npx convex env set AGENTMAIL_API_KEY <key>`, `npx convex env set AGENTMAIL_INBOX_ID <inbox_id>`, `npx convex env set AGENTMAIL_WEBHOOK_SECRET <whsec>`.
6. **Production deploy (human gate)** — `npm run deploy` (runs static-hosting build + `convex deploy`).
7. **Repo visibility (human gate)** — `gh repo edit Zen-cronic/change-order-desk --visibility public --accept-visibility-change-consequences`.
8. **Submission (human gate)** — https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit before **2026-09-22 12:00 PM PT (15:00 EDT)**: public repo, live URL, demo video < 3 min, `hackathon.md` at root.

Never paste keys into chat, commits or `hackathon.md`; `.env.local` is gitignored; `.env.example` is the tracked contract.

## Blockers

- None blocking local execution or fixture hero path (`PROVIDER_MODE=fixture` default).

## Ledger

| # | Packet | Hypothesis | Verification | Result |
|---|---|---|---|---|
| 0 | hygiene | `.gitignore` before code | `git status` shows no secrets | accepted `38bb44b` |
| 1 | scaffold (construction) | Change Order Desk initial scaffold | Local smoke test & typecheck | accepted `b6237f7` |
| 2 | pivot naming & schema | Storefront Desk pivot: normalized 12+ table relational schema & naming screen | `docs/NAMING.md` created; `convex/schema.ts` compiled; obsolete construction files removed | accepted in working tree |
| 3 | fixture vertical slice & UI | 4-sponsor hero loop: Places discovery, Firecrawl grounding, OpenAI structured outputs, rendered preview, AgentMail thread, proposal versioning, activity ledger, two-mode campaigns | `npx vitest run` (14 tests across unit and convex-test), `npm run typecheck`, `npm run build` | verified green |
| 4 | safety & policy hardening | Immutable draft approvals, invalidation on edit, 2-followup ceiling, counteroffer requires human acceptance, suppression | `convex/backend.test.ts` (7 convex-test tests) passing | verified green |
| 5 | ui polish & seesaw motions | Mobbin patterns (Attio-style review pane, Framer-style device preview), Seesaw spring motions, tactile press states, realistic iPhone chassis, and collapsible provenance ledger | Playwright browser visual tests, 14 unit & convex-test tests, strict typecheck, and production Vite build | verified green |
| 6 | bespoke dark studio command center | Complete redesign from generic SaaS layout to Obsidian Dark Studio Command Center: top command bar with breadcrumbs & fixture status, persistent left Target Pipeline with Places discovery & presence risk badges, right Main Stage with segmented console tabs and single-row responsive tab bar, embedded Live Storefront Studio, and high-contrast tabular typography | Playwright visual screenshot verification, 14 automated tests passing, strict zero-error typecheck | verified green |

## Next task

1. Commit changes to `design/ui-polish-seesaw-mobbin` branch.
2. Push branch to `origin` and verify PR #1 on GitHub.
3. Provide summary of Firecrawl MCP credentials and setup instructions.
