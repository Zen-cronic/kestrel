# Hackathon log

- **Project:** Change Order Desk
- **Event:** Convex All Gas Hackathon
- **What it does:** A renovation gets its own inbox; a homeowner's "can we also…?" becomes a priced change order that both parties approve by replying, and the live ledger of scope, price and schedule is the record.
- **Live app:** not deployed
- **Repo:** https://github.com/Zen-cronic/change-order-desk
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed (anonymous local dev deployment at http://127.0.0.1:3210 during the build)
- **Components:** @convex-dev/static-hosting, @agentmail/convex, @firecrawl/firecrawl-convex, @convex-dev/rate-limiter
- **Convex features:** queries, mutations, internal functions, actions, scheduled functions, HTTP actions, indexes, argument validators, components
- **Auth:** none
- **AI models:** none (PROVIDER_MODE=mock; `gpt-5.6-terra` wired behind the OpenAI provider interface for live mode)
- **Started:** 2026-09-04T21:32:04Z
- **Last updated:** 2026-09-04T21:46:04Z

## Log

### 2026-09-04 - 38bb44b
Started the repository with hygiene before any code: `.gitignore` for secrets, dependencies, build output, local Convex state and browser-recording artifacts. The app is new for this hackathon (build window opened 2026-08-25; repository created 2026-09-04 21:32 UTC).

### 2026-09-04 - working tree
Scaffolded the app: Vite + React frontend, Convex backend with the official components registered in `convex/convex.config.ts` (`@convex-dev/static-hosting`, `@agentmail/convex`, `@firecrawl/firecrawl-convex`, `@convex-dev/rate-limiter`), schema in `convex/schema.ts` (projects, parties, changeOrders, immutable revisions, approvals keyed by revision + party, ledger, inboundMessages, referencePrices, supplierQuotes). Change-order state machine in `convex/changeOrders.ts` (draft → awaiting_approval → approved/rejected; stale-revision and duplicate decisions rejected). Inbound email path in `convex/inbound.ts` (idempotent on message id; quoted history stripped in `convex/lib/replyText.ts`; approvals require an explicit word plus the party's token — the model never gates money). Pricing engine in `convex/pricing.ts` (rate card → supplier quote → stocked material → cached reference → crawl → unpriced-and-flagged). Provider interfaces with labelled mocks in `convex/lib/providers/` (OpenAI Responses API structured-output client wired for live mode). HTTP routes in `convex/http.ts`: `/agentmail/webhook`, `/health`, static-site catch-all. Demo project + fixtures in `convex/demo.ts` (a labelled demo contractor auto-approves ~10 s after a change order is sent). Ran the official setup: Convex plugin for Claude Code, `npx convex ai-files install`, and this build-log skill. Smoke test on the local deployment: homeowner request → priced draft (one line flagged unpriced, not guessed) → sent → both approvals → approved; duplicate reply idempotent. Unit tests for cent arithmetic and reply parsing in `tests/money.test.ts`.
