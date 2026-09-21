# Storefront Desk (Provisional)

**An agent-assisted customer-acquisition workspace for North American small and medium businesses whose online presence is missing, weak, stale, or hard to use.**

Find a real-looking local business (primary wedge: independent restaurants & cafés), assemble a cited business brief from official listing data and the open web, generate an interactive shareable website preview, and help the operator conduct a bounded email conversation that revises scope, price, timeline, and terms without surrendering commercial control to the model.

Built for the [Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas) (September 2026).

---

## The Wedge: Independent Restaurants & Cafés

Main Street merchants frequently lose high-margin sales and takeout orders because they lack a dedicated mobile-friendly digital storefront. Rather than cold-pitching generic web design or spamming business owners with bot emails, Storefront Desk enables an operator to:
1. Identify high-potential SMBs with weak digital presence signals via Google Places.
2. Ground business offerings in verified web citations via Firecrawl search & scrape.
3. Automatically build a live, shareable, interactive digital storefront preview.
4. Send an operator-approved custom pitch from an AgentMail inbox.
5. Ingest replies, automatically classify intent, and create versioned, non-binding commercial proposals.

---

## How the 4 Sponsors Are Load-Bearing

| Sponsor | Core Role in Storefront Desk |
|---|---|
| **Convex** | Real-time reactive backend, normalized relational schema (12+ indexed tables), server-side authorization, scheduled follow-up orchestration, immutable activity ledger, and official components (`@convex-dev/static-hosting`, `@convex-dev/rate-limiter`, `@convex-dev/agent`, `@agentmail/convex`, `@firecrawl/firecrawl-convex`). |
| **OpenAI** | Structured outputs for cited business briefs, typed website specifications, personalized outreach emails, and structured reply/counteroffer classification via `@convex-dev/agent`. |
| **Firecrawl** | Deep web search and scrape of public SMB pages to gather verified citations and flag unknown details with strict provenance. |
| **AgentMail** | Operator-owned custom inbox provisioning, inbound webhook ingestion with Svix signature verification, idempotency deduplication, and threaded conversation tracking. |

---

## Key Safety Invariants

- **Human Gates on Outreach:** The model never sends emails autonomously. First pitches always require human operator review.
- **Approval Invalidation:** Any edit made to an approved email draft immediately invalidates the approval (`expired_due_to_edit`).
- **Bounded Automated Follow-ups:** In `assisted_followups` mode, at most **two** non-binding follow-ups can be scheduled. A third is impossible at the schema level. Follow-ups automatically cancel upon reply, unsubscribe, bounce, or manual pause.
- **No Autonomous Commercial Binding:** When a client replies with a counteroffer (e.g. asking for a lower price or new scope), the model creates a new proposal version with `isCommerciallyBinding: false` and `humanDecisionRequired: true`. Only an authorized human operator can accept or decline terms.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Convex backend dev server
npm run dev:backend

# 3. Start Vite frontend dev server (separate terminal)
npm run dev
# Opens at http://localhost:5173
```

By default, the application runs in **Fixture Mode** (`PROVIDER_MODE=fixture`), meaning all 4 sponsors operate deterministically offline without requiring live API keys.

To run tests:
```bash
npm test          # Runs 14 vitest unit & backend integration tests
npm run typecheck # Strict TypeScript checking
npm run build     # Production client build
```

---

## Demo Walkthrough

See [`docs/DEMO.md`](docs/DEMO.md) for the complete 60–90 second judge click path, and [`docs/NAMING.md`](docs/NAMING.md) for naming screening and rationale.

## License

MIT
