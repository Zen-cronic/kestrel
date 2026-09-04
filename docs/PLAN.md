# Build plan — Change Order Desk (Convex All Gas, deadline 2026-09-22 12:00 PT = 15:00 EDT)

Solo, ~8.5 net build-days from 2026-09-04 evening. Demo video + `hackathon.md` polish + two social posts are first-class deliverables, not leftovers. Rubric-tagged commits (`feat: … (Convex depth)`).

| Day | Date | Packet | Rubric axis | Done when |
|---|---|---|---|---|
| D1 | Sep 4–5 | Scaffold: schema, approvals state machine, providers (mock), HTTP routes, UI shell, demo seed, static hosting config | Convex depth · Live URL | `npx convex dev --once` pushes; typecheck + vitest green; two-window approval flips locally |
| D2 | Sep 6 | AgentMail live: inbox per project, Svix-verified `/agentmail/webhook`, in-thread send/reply, reply stripping, token check | Sponsor stack | a real email to the project inbox creates a draft; a real "approve" reply records an approval |
| D3 | Sep 7 | OpenAI live extraction (structured outputs) + pricing engine order: rate card → supplier quote → reference → unpriced | Sponsor stack · C&U | messy top-posted request → correct lines; unpriced lines amber |
| D4 | Sep 8–9 (evenings) | Firecrawl live: `search`/`scrape` reference prices with provenance + expiry; supplier-quote inbound path (supplier as third party) | Sponsor stack | a line shows URL + fetched-at; a supplier's emailed quote reprices a revision |
| D5 | Sep 10–11 (evenings) | **design-direction pass first** (`skills/design-direction`), then UI: project page with the 10%-over-estimate meter, CO page, ledger, "act as" demo toggles, on-page approve | C&U · Video | the five storyboard screens exist; mobile width works |
| D6 | Sep 12–13 | Convex Auth v2 alpha (password + anonymous demo), access control in every public function, rate limiter on inbound, tests, `hackathon.md` currency, first `deploy` to convex.site (operator-run) | Convex depth · Live URL | judges open the prod URL cold and close a demo change order alone |
| D7 | Sep 14–18 (evenings) | polish, error/empty/recovery states, Mode B judge panel at T-4, fixes | all | panel gap list empty or scheduled |
| D8 | Sep 19–20 | `demo-study` → `demo-director`: 70-second run-of-show, record, cut (<3:00); social post #2 draft; README final | Video · Social | video uploaded; posts drafted |
| D9 | Sep 21 | `submission-audit`; repo public (operator gate); vibeapps.dev submission (operator gate); post #2 | — | submitted before 2026-09-22 15:00 EDT with buffer |

Social post #1 (build-in-public, homeowner's seat): target Sep 12 (T-10). Post #2 (launch): Sep 21.

Kill/flip conditions are tracked in the suite's `state.md` (F1–F5). Provider credentials are human gates; every packet must run in `PROVIDER_MODE=mock` first.
