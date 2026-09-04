# BUILD_CHECKPOINT — Change Order Desk

**Status headline (2026-09-04 17:47 EDT):** packet 1 (scaffold + hero path) accepted at `b6237f7`; hero path runs end to end in mock mode on the local deployment; typecheck, tests and build green. No deployment to convex.site yet (operator's Convex account needed). Next: packet 2 (AgentMail live) is credential-gated; packet 5 (design-direction + two-window UI) can proceed in mock mode.

**Current accepted state:** commit `b6237f7` on `main` (private remote `origin`), verified on the anonymous local deployment in mock mode.

Concept lock: PROVISIONAL (operator pre-authorization 2026-09-04; revisable). Strategy, decision brief, flip conditions and research live in the suite repo at `hackathon-agent/hackathons/convex-allgas-2026/state.md`.

## Human gates — operator actions (exact steps)

None of these blocks local development in `PROVIDER_MODE=mock`. In order of urgency:

1. ~~Register on Luma~~ **done 2026-09-04.** Next: **check the Luma confirmation email** (and Convex Discord `#hackathon`) for the **Firecrawl 20k-credit promo code** (prior editions used `MODERNSTACK` / `TANSTACK10K` at https://firecrawl.dev/signup).
2. **Convex account + project** — https://dashboard.convex.dev/signup (GitHub login; Free plan; no card). Then in this repo: `npx convex login` → `npx convex dev` (choose *create a new project*: `change-order-desk`). Expected: `.env.local` gains `CONVEX_DEPLOYMENT` + `VITE_CONVEX_URL`; dashboard shows the tables from `convex/schema.ts`.
3. **AgentMail** — https://console.agentmail.to (Free: 3 inboxes, 100 emails/day, no card). Create an API key. Set: `npx convex env set AGENTMAIL_API_KEY <key>`; create a webhook in the console pointing at `https://<deployment>.convex.site/agentmail/webhook` for `message.received` (+ `message.bounced`), copy the signing secret → `npx convex env set AGENTMAIL_WEBHOOK_SECRET <whsec>`. Expected: sending any email to the project inbox address shown on a project page creates an inbound row in the dashboard.
4. **Firecrawl** — https://www.firecrawl.dev/signin (Free: 1,000 credits/month, no card; add the hackathon code if provided). Create an API key → `npx convex env set FIRECRAWL_API_KEY <key>`. Expected: a change-order line shows a "reference" price with a URL and fetched-at.
5. **OpenAI** — https://platform.openai.com/api-keys → project-scoped key; confirm prepaid balance ≥ US$10 (expected spend < US$20 total). `npx convex env set OPENAI_API_KEY <key>` and `npx convex env set OPENAI_MODEL gpt-5.6-terra` and `npx convex env set PROVIDER_MODE live`. Expected: a messy request email yields extracted lines in the dashboard's `revisions` table with `source.type` values.
6. **Demo inbound secret** — `npx convex env set DEMO_INBOUND_SECRET <random-32-chars>` (used only by the labelled fixture route on the demo project).
7. **Production deploy (human gate)** — `npm run deploy` (runs `npx @convex-dev/static-hosting deploy`: build + `convex deploy` + upload). Expected: `https://<prod-deployment>.convex.site` opens cold to the seeded demo project. Verify from a logged-out browser before submitting.
8. **Repo visibility (human gate)** — suggested T-3 (2026-09-19): `gh repo edit Zen-cronic/change-order-desk --visibility public --accept-visibility-change-consequences`. Required at submission (*"All GitHub repos must be public to qualify."*).
9. **Social posts (human gate)** — #1 build-in-public from the homeowner's seat (~Sep 12), #2 launch (Sep 21); tag @convex @OpenAI @firecrawl @agentmail (verify handles: Convex's own pages use @firecrawl_dev). Record links in `hackathon.md`.
10. **Submission (human gate)** — https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit before **2026-09-22 12:00 PM PT (15:00 EDT)**: public repo, live convex.site URL, video < 3 min, `hackathon.md` at root.

Never paste keys into chat, commits or `hackathon.md`; `.env.local` is gitignored; `.env.example` is the tracked contract.

## Blockers

- (none blocking mock mode)

## Ledger

| # | Packet | Hypothesis | Verification | Result |
|---|---|---|---|---|
| 0 | hygiene | `.gitignore` before code | `git status` shows no secrets | accepted `38bb44b` |
| 1 | scaffold | schema + approvals state machine + providers + docs compile and push locally | `npx convex dev --once` (6 components installed) · `npx tsc -b --noEmit` · `npx vitest run` (4 tests) · `npx vite build` · `npx convex run` smoke sequence (seed → sendAsHomeowner → sendForApproval → replyAs approve → status approved, 2 approvals, duplicate ignored) | accepted `b6237f7` |

## Next task

Packet 2 (AgentMail live): provision one inbox per project via the component from an action; wire `Mail.send` to `agentmail.sendMessage`; verify a real inbound `message.received` webhook creates a draft; then in-thread reply. Requires the operator's AgentMail key + webhook secret (human gate 3). Until then: packet 5 (UI: design-direction pass, two-window demo) can proceed in mock mode.
