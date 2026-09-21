# Hackathon log

- **Project:** Storefront Desk (Provisional)
- **Event:** Convex All Gas Hackathon
- **What it does:** An agent-assisted customer-acquisition workspace for North American SMBs with weak web presence, combining Google Places discovery, Firecrawl open-web citations, OpenAI structured briefs and specifications, and operator-owned AgentMail threads.
- **Live app:** not deployed
- **Repo:** https://github.com/Zen-cronic/change-order-desk
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed (anonymous local dev deployment during build)
- **Components:** @convex-dev/static-hosting, @agentmail/convex, @firecrawl/firecrawl-convex, @convex-dev/rate-limiter, @convex-dev/agent
- **Convex features:** queries, mutations, internal functions, actions, internal actions, scheduled functions, HTTP actions, indexes, argument validators, components
- **Auth:** none
- **AI models:** gpt-5.6-terra (PROVIDER_MODE=fixture default; OpenAI Responses API structured outputs via @convex-dev/agent in live mode)
- **Started:** 2026-09-04T21:32:04Z
- **Last updated:** 2026-09-21T18:35:00Z

## Log

### 2026-09-04 - 38bb44b
Started the repository with hygiene before any code: `.gitignore` for secrets, dependencies, build output, local Convex state and browser-recording artifacts. The app is new for this hackathon (build window opened 2026-08-25; repository created 2026-09-04 21:32 UTC).

### 2026-09-04 - b6237f7
Scaffolded the app: Vite + React frontend, Convex backend with the official components registered in `convex/convex.config.ts` (`@convex-dev/static-hosting`, `@agentmail/convex`, `@firecrawl/firecrawl-convex`, `@convex-dev/rate-limiter`), schema in `convex/schema.ts` (projects, parties, changeOrders, immutable revisions, approvals keyed by revision + party, ledger, inboundMessages, referencePrices, supplierQuotes). Change-order state machine in `convex/changeOrders.ts` (draft → awaiting_approval → approved/rejected; stale-revision and duplicate decisions rejected). Inbound email path in `convex/inbound.ts` (idempotent on message id; quoted history stripped in `convex/lib/replyText.ts`; approvals require an explicit word plus the party's token — the model never gates money). Pricing engine in `convex/pricing.ts` (rate card → supplier quote → stocked material → cached reference → crawl → unpriced-and-flagged). Provider interfaces with labelled mocks in `convex/lib/providers/` (OpenAI Responses API structured-output client wired for live mode). HTTP routes in `convex/http.ts`: `/agentmail/webhook`, `/health`, static-site catch-all. Demo project + fixtures in `convex/demo.ts` (a labelled demo contractor auto-approves ~10 s after a change order is sent). Ran the official setup: Convex plugin for Claude Code, `npx convex ai-files install`, and this build-log skill. Smoke test on the local deployment: homeowner request → priced draft (one line flagged unpriced, not guessed) → sent → both approvals → approved; duplicate reply idempotent. Unit tests for cent arithmetic and reply parsing in `tests/money.test.ts`.

### 2026-09-21 - 082c371
Pivoted the application to Storefront Desk (provisional), targeting North American SMBs with missing or weak online presence, with an initial demo wedge for independent restaurants and cafés (`docs/NAMING.md`). Replaced the construction domain model with a normalized 12-table relational schema (`convex/schema.ts`): workspaces, campaigns, discoverySearches, placesCandidates, prospects, sourceDocuments, evidenceClaims, businessBriefs, websiteSpecs, outreachDrafts, agentMailThreads, agentMailMessages, proposals, followupSchedules, and activityLedger. Added `@convex-dev/agent` to registered components in `convex/convex.config.ts`. Implemented the 4-sponsor hero loop: Google Places candidate discovery (`convex/discovery.ts`), Firecrawl web citations and claim verification (`convex/evidence.ts`), OpenAI structured business briefs and website specifications (`convex/generator.ts`), shareable reactive website preview (`convex/previews.ts`, `src/pages/WebsitePreview.tsx`), operator-controlled pitch dispatch via AgentMail (`convex/outreach.ts`), threaded reply ingestion with autonomous counteroffer classification (`convex/threads.ts`), and non-binding commercial proposal versioning requiring explicit human operator approval (`convex/proposals.ts`). Enforced campaign safety modes: `manual` and `assisted_followups` with a hard 2-followup ceiling and automatic cancellation on reply or unsubscribe (`convex/followups.ts`). Added comprehensive test coverage with 14 automated tests passing across `tests/money.test.ts`, `tests/provider_fixtures.test.ts`, and `convex/backend.test.ts` using `convex-test` in the edge runtime.

### 2026-09-21 - UI & Motion Craft Polish
Elevated the web interface with Seesaw-inspired motion physics (`--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)`, tactile press states `scale(0.97)`, pulsing realtime indicators, staggered card reveals) and Mobbin-grounded interaction patterns. Upgraded the operator dashboard with Attio-inspired two-tone proposal and pitch review cards, and upgraded the website preview host with Framer/Squarespace-inspired glassmorphism viewport controls, responsive desktop/mobile switcher, realistic iPhone mock chassis with dynamic island, and a collapsible operator grounding & provenance citations drawer. Verified with visual Playwright captures across viewports, 14 unit and convex-test tests, and strict production build.
