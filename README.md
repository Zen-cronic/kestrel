# Kestrel — Autonomous SMB Modernization Forge

> **Turn 30% delivery app commission bleed into owned, high-converting digital storefronts in under 90 seconds.**

[![Convex All Gas Hackathon](https://img.shields.io/badge/Convex-All_Gas_Hackathon-orange.svg)](https://www.convex.dev/hackathons/all-gas)
[![Live Demo](https://img.shields.io/badge/Live_App-glad--pony--138.convex.site-blue.svg)](https://glad-pony-138.convex.site)
[![YouTube Walkthrough](https://img.shields.io/badge/YouTube_Demo-2%3A53-red.svg)](https://youtu.be/r1zigRL3lpo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Built for the **[Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas)** (September 2026), sponsored by **Convex**, **OpenAI**, **Firecrawl**, and **AgentMail**.

---

## 📺 Live Video Walkthrough

Watch the complete 2:53 product demonstration reel on YouTube:  
**▶️ [https://youtu.be/r1zigRL3lpo](https://youtu.be/r1zigRL3lpo)**

---

## 🛑 The Problem: The 30% Commission Bleed

Across North America, hundreds of thousands of independent restaurants, cafés, and roasteries are caught in an existential margin squeeze:
1. **The Aggregator Tax:** Third-party platforms (DoorDash, UberEats, Grubhub) extract **15% to 30% in commission fees** on every order. For an independent restaurant operating on a fragile 5% to 8% net margin, this commission bleed often wipes out their entire profit.
2. **The Discovery Trap:** When customers search Google Places or Maps, they find glowing 4.8-star reviews—but **no official first-party website**. Instead, delivery aggregator buttons dominate the listing, siphoning customer relationships and profits.
3. **The Agency Impasse:** Traditional web agencies charge $4,000+ with 6 to 8 weeks of slow design revisions and questionnaire bottlenecks. Overworked SMB owners working 14-hour days don't have the time to manage a web project, so they remain trapped on commission-heavy apps.

---

## ⚡ The Solution: Kestrel

Kestrel inverts the agency model into a high-speed, agentic command center:
1. **Google Places Discovery Radar:** Ingests local business listings, isolating high-reputation SMBs with missing or weak first-party websites.
2. **Anti-Hallucination Firecrawl Recon:** Deeply scrapes public menus, social presences, operating hours, and tech stacks. Verified claims are grounded in RFC-92 evidence documents, while unconfirmed services are explicitly isolated as `Needs Confirmation`—never fabricating offerings.
3. **OpenAI Structured Generation:** Emits typed, responsive, Framer-grade website specifications directly into Convex relational tables.
4. **Sovereign Human-in-the-Loop Outreach:** Drafts bespoke commercial proposals. If an operator edits pricing or copy, prior approval is instantly revoked (`expired_due_to_edit`).
5. **Two-Way AgentMail Negotiation Desk:** Sends authenticated emails from a dedicated domain (`break-solutions@agentmail.to`), ingests client replies via webhooks, classifies counteroffers autonomously with OpenAI, and prepares revised terms—while strictly barring AI from binding contracts without explicit human sign-off.
6. **Continuous GitHub CI/CD & Deploy Briefings:** Connects to GitHub, triggering auto-deploys on commit and dispatching verified release emails with preview links via AgentMail.

---

## 🏗️ How the 4 Sponsors Are Load-Bearing

| Sponsor | Core Role in Kestrel |
|---|---|
| **Convex** | Real-time reactive backend, normalized relational schema (**17 indexed tables**), server-side authorization, scheduled follow-up crons with strict 2-attempt ceiling, immutable activity ledger, static web hosting, and 5 official components (`@convex-dev/static-hosting`, `@convex-dev/rate-limiter`, `@convex-dev/agent`, `@agentmail/convex`, `@firecrawl/firecrawl-convex`). |
| **OpenAI** | Responses API (`gpt-5.6-terra`) via `@convex-dev/agent` emitting deterministic, `zod`-validated JSON schemas for diagnostic business briefs, responsive Framer-grade website specifications, personalized outreach pitches, and inbound counteroffer term extractions. |
| **Firecrawl** | Deep on-demand web search and scrape (`convex/recon.ts`, `convex/evidence.ts`) auditing website deficiencies (stale copyright, missing SSL, missing SEO meta description) and extracting verified truth claims for the interactive citations drawer. |
| **AgentMail** | Operator-owned dedicated domain inboxes (`break-solutions@agentmail.to`), inbound webhook ingestion with Svix signature verification, live bidirectional inbox synchronization, threaded negotiation state, and automated CI/CD release briefings. |

---

## 🛡️ Key Safety & Commercial Invariants

- **Human Gates on Outreach:** The model never sends emails autonomously. First pitches always require explicit human operator review.
- **Approval Invalidation:** Any edit made to an approved email draft immediately invalidates the approval (`expired_due_to_edit`).
- **Bounded Automated Follow-ups:** At most **two** non-binding follow-ups can be scheduled. A third is impossible at the schema level. Follow-ups automatically cancel upon reply, unsubscribe, bounce, or manual pause.
- **Sovereign Gate on Contracts:** When a client replies with a counteroffer (e.g., "$1,000 CAD and 10 days"), OpenAI parses the diff, but AI is strictly prohibited from binding commercial terms (`isCommerciallyBinding: false`). Only an authorized human operator can accept or decline terms.

---

## 🚀 Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/Zen-cronic/kestrel.git
cd kestrel

# 2. Install dependencies
npm install

# 3. Start Convex backend dev server
npx convex dev

# 4. Start Vite frontend dev server (in a separate terminal)
npm run dev
# Opens at http://localhost:5173
```

By default, Kestrel runs in **Fixture Mode** (`PROVIDER_MODE=fixture`), meaning all 4 sponsors operate deterministically offline without requiring live API keys.

To run the verification test suite:
```bash
npm test          # Runs 16 automated unit & convex-test tests
npm run typecheck # Strict TypeScript compiler verification
npm run build     # Production client bundle verification
```

---

## 📁 Submission Artifacts

- **Judges Guide & Speedrun:** [`docs/DEMO.md`](docs/DEMO.md) & [`submission/kestrel/JUDGES_GUIDE.md`](submission/kestrel/JUDGES_GUIDE.md)
- **Detailed Written Submission:** [`submission/kestrel/SUBMISSION.md`](submission/kestrel/SUBMISSION.md)
- **VibeApps Form Fields:** [`submission/kestrel/COPY_PASTE_FIELDS.txt`](submission/kestrel/COPY_PASTE_FIELDS.txt)
- **Living Hackathon Build Log:** [`hackathon.md`](hackathon.md)

## 📄 License

[MIT](LICENSE) © Zen-cronic Team
