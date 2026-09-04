# Change Order Desk

**Every "can we also…?" on a renovation becomes a priced change order that the homeowner and the contractor both approve by replying to the email — and the live ledger is the record when someone later says "I never agreed to that."**

Built for the [Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas). Convex is the backend (database, functions, real-time sync, scheduled functions, file storage, components); the frontend is served from Convex static hosting on convex.site; AgentMail gives each project its own inbox; Firecrawl supplies reference prices from public supplier pages with provenance; OpenAI turns the request into line items. Nothing is sent, priced or approved by the model alone: application code decides, and a person replies.

## Why this exists

Small renovators (1–10 people) run change orders over text and email, then argue about them at the final invoice. In Ontario the Consumer Protection Act caps the final price at 10% over the written estimate unless the change was approved in writing — so an unapproved extra is money the contractor cannot collect and a surprise the homeowner never agreed to. The tools that handle this (change-order modules in $500/month builder suites) require the homeowner to adopt a portal. Change Order Desk needs nothing from either party but the email thread they already have.

Unlike a permit tracker or a quote-comparison inbox, this is the ledger both sides sign by replying.

## How the sponsors do real work

| Sponsor | What it does on the hero path |
|---|---|
| **Convex** | projects, parties, change orders, immutable revisions, approvals keyed by (revision, party), ledger — with live subscriptions so both parties see the same record change; scheduled reminders; file storage for attachments; official components registered in `convex/convex.config.ts` |
| **AgentMail** | each project's inbox: the homeowner's request and the parties' approval replies arrive as signed `message.received` webhooks (idempotent on message id); the change order and the approved notice go out in-thread |
| **Firecrawl** | `search` / `scrape` on public supplier and manufacturer pages for a *reference* unit price — shown with URL, fetched-at and expiry, labelled "reference, not quote"; the contractor's own rate card and emailed supplier quotes are the truth |
| **OpenAI** | Responses API with structured outputs turns the email into line items, labour hours and the questions the contractor must confirm; drafts the plain-language change-order email |

## Status

Scaffold. See [`hackathon.md`](hackathon.md) (the build log judges read), [`BUILD_CHECKPOINT.md`](BUILD_CHECKPOINT.md) (current state + operator actions) and [`docs/PLAN.md`](docs/PLAN.md).

## Running locally

```bash
npm install
npx convex dev            # provisions a dev deployment and generates convex/_generated
npm run dev               # Vite on http://localhost:5173
```

Provider mode defaults to `mock` (deterministic fixtures, clearly labelled in the UI). See `.env.example` for the deployment environment variables that switch each provider to live.

## License

MIT
