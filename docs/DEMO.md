# Storefront Desk — Judge Demo Runbook

**Provisional Name:** Storefront Desk  
**Target Event:** Convex All Gas Hackathon (September 2026)  
**Primary Wedge:** North American Independent Restaurants & Cafés (Toronto, ON)  
**Safety Invariant:** Fixture Mode is default; NO emails or external requests are sent without operator approval and live credentials.

---

## 1. Quickstart & Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Run backend dev server (generates convex/_generated and runs local functions)
npm run dev:backend

# 3. Run frontend dev server (in a separate terminal)
npm run dev
# Opens on http://localhost:5173
```

---

## 2. The 60–90 Second Judge Hero Path (Fixture Mode)

Judges can experience the complete four-sponsor hero loop in under 90 seconds without configuring any API keys:

1. **Open the Workspace:** Navigate to `http://localhost:5173/`. Notice the header banner: **"Fixture mode — no external messages are sent"**.
2. **Reset Demo Workspace (1 Click):** Click the red button in the top right: **"🔄 Reset Demo Workspace"**.
   - This cleans prior state, provisions the workspace, loads the Toronto café campaign, inserts 3 Google Places candidates, audits the primary prospect via Firecrawl, creates grounded business briefs & website specifications, drafts the commercial proposal, and opens the **Discovery** tab.
3. **Inspect Discovery & Weak-Presence Signals:**
   - Review **The Rustic Kettle Café & Roastery** (4.6 stars, 187 reviews, West Queen West).
   - See detected signals: *"No active website domain on Google Places"*, *"Missing digital menu & mobile ordering"*.
   - Click **"Select & Review Lead"** or click into the **Evidence** tab.
4. **Inspect Evidence & Provenance:**
   - View normalized Google Places facts alongside Firecrawl scraped source records.
   - Note the factual citations: direct-trade coffee, cardamom buns, and dog-friendly patio are verified.
   - Note the flagged unknown: *"Corporate catering packages — not confirmed on public web"*, clearly marked as `Needs confirmation`.
5. **Inspect the Real Website Preview:**
   - Click **"Preview v1 (Live Generated Preview)"** or open `/preview/rustic-kettle-preview-v1`.
   - Toggle between **Desktop** and **Mobile (375px)** views.
   - Click **"Inspect Grounding Citations"** to open the operator grounding drawer showing which evidence claims back each section.
6. **Review & Approve Outreach Draft:**
   - Return to the Desk and open the **Outreach** tab.
   - View the draft proposed price ($1,250.00 CAD) and 7-day turnaround.
   - *Test approval invalidation:* Click **"Edit Pitch"**, change the price or body text, and save. Notice that prior approval is immediately marked `expired_due_to_edit`.
   - Click **"Approve & Dispatch Pitch"** to send the email into the thread.
7. **Thread & Autonomous Counteroffer Negotiation:**
   - Open the **Inbox Thread** tab to see the outbound pitch recorded with timestamp and thread ID.
   - Click **"Simulate Inbound Counteroffer"** (simulates the owner replying: *"Can we do this for $1,000 CAD and 10 days delivery?"*).
   - Watch the thread update reactively in real time.
   - Open the **Proposals & Terms** tab: Notice proposal **v2** created with `$1,000.00 CAD` and `10 days`.
   - **Key Safety Invariant:** The status is `counter_proposed_by_client` and `isCommerciallyBinding: false`. The model cannot accept the offer autonomously; a human operator must click **"Accept Counteroffer"** or **"Decline"**.
   - Click **"Accept Counteroffer"**. The proposal status transitions to `accepted` and becomes legally binding.
8. **Inspect the Reactive Audit Ledger:**
   - Open the **Activity Ledger** tab.
   - Review the complete append-only chronology: discovery, evidence extraction, website generation, draft approval, dispatch, inbound ingestion, classification, proposal creation, and operator acceptance.

---

## 3. How the 4 Sponsors Are Load-Bearing

| Sponsor | Role on the Hero Path |
|---|---|
| **Convex** | Real-time reactive database, relational schema (12+ indexed tables), server-side function authorization, scheduled follow-up orchestration, immutable activity ledger, and official components (`@convex-dev/static-hosting`, `@convex-dev/rate-limiter`, `@convex-dev/agent`, `@agentmail/convex`, `@firecrawl/firecrawl-convex`). |
| **OpenAI** | Grounded structured outputs for business brief, typed website specification, personalized outreach draft, and structured reply/counteroffer classification via `@convex-dev/agent`. |
| **Firecrawl** | Deep web search and scrape of SMB public mentions, menu snippets, and social presences to gather verified citations and flag unknown details. |
| **AgentMail** | Operator-owned custom inbox provisioning, inbound webhook ingestion with Svix signature verification, idempotency deduplication, and threaded conversation tracking. |

---

## 4. Live Mode Transition

To run in live mode with real external APIs:
1. Set the following deployment environment variables via `npx convex env set`:
   - `PROVIDER_MODE=live`
   - `OPENAI_API_KEY=<your-key>`
   - `OPENAI_MODEL=gpt-5.6-terra`
   - `GOOGLE_PLACES_API_KEY=<your-key>`
   - `FIRECRAWL_API_KEY=<your-key>`
   - `AGENTMAIL_API_KEY=<your-key>`
   - `AGENTMAIL_INBOX_ID=<operator-inbox-id>`
   - `AGENTMAIL_WEBHOOK_SECRET=<signing-secret>`
2. All human gates (operator approvals for prospects, outbound emails, and commercial terms) remain strictly active even in live mode.
