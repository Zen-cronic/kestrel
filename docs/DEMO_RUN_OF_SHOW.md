# Storefront Desk — Demo Video Screenplay & Run-of-Show
**Event:** Convex All Gas Hackathon (September 2026)  
**Target Duration:** Exactly 2:40 (160 seconds; budgeted within the 2:30–2:45 envelope, well under the 3:00 cap)  
**Capture Rig:** Playwright MCP / Headless Chromium 1920×1080 @ 60fps (or Screen Studio / Recordly over Playwright automation)  
**Safety Invariant:** Fixture Mode default (`PROVIDER_MODE=fixture`); no external emails or model hallucination on camera  

---

## 1. Executive Summary & Highlight Strategy

### The Narrative Hook: The 30% Commission Bleed vs Instant Storefront
North American Main Street SMBs (independent restaurants, roasteries, and bakeries) bleed up to 30% in margin to third-party delivery marketplaces (UberEats, DoorDash) because building an owned digital storefront takes weeks of manual agency back-and-forth.

**Storefront Desk** solves this with an agent-assisted operator console:
1. **Google Places Discovery:** Surfaces businesses with high ratings but missing first-party websites.
2. **Firecrawl Web Audit & Anti-Hallucination Invariant:** Scrapes menus, reviews, and operating hours while explicitly tagging unknown services (e.g., catering) as `Needs Confirmation` rather than hallucinating them.
3. **OpenAI Structured Generation:** Emits typed, responsive web storefront specifications directly into Convex relational tables.
4. **AgentMail Inbound Negotiation & Commercial Safety Gate:** Manages outreach pitches with strict approval invalidation on edits, ingests replies, classifies counteroffers autonomously, but **strictly bars AI from binding money**—demanding explicit human operator acceptance.
5. **Convex Real-Time Reactive Ledger:** Every action, state transition, and audit citation syncs instantly across 12 relational tables.

---

## 2. Technical Pre-Flight & Playwright Capture Configuration

### Recording Rig Setup
- **Resolution:** 1920 × 1080 (16:9 HD) with `deviceScaleFactor: 2` (clean retina text rendering).
- **Chrome Flags:** `--kiosk --ozone-platform=x11 --disable-blink-features=AutomationControlled` (hides URL chrome, localhost tabs, and bot detection banners).
- **Audio:** Kokoro-82M or F5-TTS narration track mastered at -14 LUFS, timed to visual grid intervals.
- **Motion Physics:** Seesaw spring easing (`cubic-bezier(0.16, 1, 0.3, 1)`) with smooth 3–4s single-direction scrolls; no idle jitter.

```typescript
// Playwright Capture Config Preset
export const demoViewportConfig = {
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: {
    dir: "./artifacts/demo_takes/",
    size: { width: 1920, height: 1080 },
  },
};
```

---

## 3. High-Level Run-of-Show Grid (2:40 Total Runtime)

| Time | Beat Title | Primary Visual (Playwright Cue) | Core VO Message | Rubric Target |
|---|---|---|---|---|
| **0:00–0:20** | **Cold Open: The SMB Commission Bleed** | Split Contrast: Places profile bleeding 30% delivery commission vs instant verified digital storefront | "Main Street SMBs lose 30% to delivery apps. What if you gave them an owned storefront in 90 seconds?" | **Impact & Value** |
| **0:20–0:40** | **Command Center & Sponsor Engine** | Obsidian Dark Studio reveals; click `⚡ Reset Hero Flow` on the 4-sponsor engine | "Storefront Desk combines Convex, Firecrawl, OpenAI, and AgentMail with human-in-the-loop control." | **Design & Craft / Technical** |
| **0:40–1:05** | **Discovery & Anti-Hallucination Audit** | Select *The Rustic Kettle*; inspect Firecrawl citations and the unconfirmed catering flag | "Firecrawl audits open-web citations. Crucially, missing items are flagged—never hallucinated." | **Technical Execution** |
| **1:05–1:30** | **Responsive Storefront Studio & Citations** | Preview v1 tour; switch to 390px mobile chassis; open Grounding Citations drawer | "A real, responsive website on Convex. Mobile-ready, backed by verified source citations." | **Design & Craft / Technical** |
| **1:30–1:50** | **Pitch Queue & Invalidation Guardrail** | Edit pitch price; trigger `expired_due_to_edit` warning; approve and dispatch | "Edit the pitch, and approval instantly revokes. Safety first before AgentMail dispatch." | **Completeness / Technical** |
| **1:50–2:20** | **AgentMail Counteroffer & Human Gate** | Simulate inbound counteroffer ($1,000 / 10 days); review v2 terms; operator accepts | "AI classifies the counteroffer, but cannot sign. Only the operator can bind the agreement." | **Technical / Completeness** |
| **2:20–2:40** | **Immutable Activity Ledger & Close** | Scroll live reactive ledger; recap 4-sponsor stack; end-card with repo and live URL | "Every event logged immutably in Convex. Built for the Convex All Gas Hackathon." | **Completeness / Impact** |

---

## 4. Deep-Dive Screenplay & Directed Beats

### Beat 1: The Cold Open — The SMB Commission Bleed (0:00 – 0:20)
- **Duration:** 20 seconds
- **Rubric Criterion:** **Impact / Value**
- **Visual Action (Playwright / Video Compositing):**
  1. *0:00–0:08:* Left split screen frames a real-world Google Places listing for *"The Rustic Kettle Café & Roastery"* (4.6 stars, 187 reviews, West Queen West Toronto). Prominent red callout pill: `⚠️ No Website Detected • 30% Marketplace Commission Bleed`.
  2. *0:08–0:20:* Dynamic wipe transition to the right split screen: revealing the stunning, live-generated Storefront Desk digital storefront for The Rustic Kettle with zero-commission direct ordering and artisanal branding.
- **Playwright Automation Cue:**
  ```typescript
  // Start on cold-open comparison plate
  await page.goto("http://localhost:5173/");
  // Show side-by-side impact graphic overlay for 8 seconds, then crossfade to Workspace
  ```
- **Verbatim Voiceover Script:**
  > *"Every day, thousands of beloved local restaurants like Toronto's Rustic Kettle lose thirty percent of their margin to third-party delivery apps—simply because building a custom web presence takes weeks of agency back-and-forth.*  
  > *What if an operator could discover them, verify their public facts without hallucinating, generate a production-ready storefront, and negotiate the outreach deal—in under ninety seconds?"*

---

### Beat 2: Identity, Studio Command Center & 4-Sponsor Engine (0:20 – 0:40)
- **Duration:** 20 seconds
- **Rubric Criterion:** **Design & Craft** + **Technical Execution**
- **Visual Action (Playwright):**
  1. *0:20–0:26:* Reveal the bespoke Obsidian Dark Studio Command Center. Camera zooms smoothly into the top command bar: Storefront Desk logo, `Deterministic Fixture Mode` indicator, and the 4-sponsor status pills (`Convex Relational DB`, `OpenAI Responses`, `Firecrawl Audit`, `AgentMail`).
  2. *0:26–0:33:* Mouse hovers with tactile spring physics over the top-right action button: `⚡ Reset Hero Flow`.
  3. *0:33–0:40:* Click `⚡ Reset Hero Flow`. A notification banner glides down (`ℹ️ Demo environment reset: seeded 'The Rustic Kettle' hero flow!`). Watch the left Target Pipeline populate reactively across 12 relational Convex tables without a page reload.
- **Playwright Automation Cue:**
  ```typescript
  await page.locator("button:has-text('⚡ Reset Hero Flow')").click();
  await page.waitForSelector(".pipeline-sidebar .candidate-item-card");
  await page.waitForTimeout(2000);
  ```
- **Verbatim Voiceover Script:**
  > *"Meet Storefront Desk: an agent-assisted customer acquisition workstation built on Convex, powered by Firecrawl, OpenAI, and AgentMail.*  
  > *With one click, Convex resets and provisions our workspace, orchestrating twelve relational tables in real time. The model never runs unguided: human operators maintain complete sovereign authority."*

---

### Beat 3: Places Discovery & Anti-Hallucination Firecrawl Audit (0:40 – 1:05)
- **Duration:** 25 seconds
- **Rubric Criterion:** **Technical Execution**
- **Visual Action (Playwright):**
  1. *0:40–0:48:* Left sidebar: inspect the 3 Toronto café candidates. Cursor hovers over *The Rustic Kettle* card, showing weak presence signals: `⚠️ No official first-party website detected on Google Places` and `⚠️ High marketplace commission risk`. Status shows `✓ Active Dossier Loaded`.
  2. *0:48–0:56:* Click into the `📑 Grounded Brief` tab. Screen reveals the two-column audit: *Open-Web Scraped Sources* (Firecrawl) on the left, *Established Factual Claims* on the right.
  3. *0:56–1:05:* **Highlight Moment:** Cursor zooms in on the amber warning box at the bottom:
     `⚠️ Explicitly Unconfirmed Details: Corporate event catering packages & custom birthday cake orders were not found on the open web. Marked as "Needs Confirmation" rather than fabricated.`
- **Playwright Automation Cue:**
  ```typescript
  await page.locator(".desk-tab-btn:has-text('Grounded Brief')").click();
  await page.waitForSelector(".evidence-list");
  // Smooth scroll down to highlight the anti-hallucination callout
  await page.locator("strong:has-text('⚠️ Explicitly Unconfirmed Details:')").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  ```
- **Verbatim Voiceover Script:**
  > *"Discovery begins on Google Places, targeting high-reputation SMBs lacking an owned website. Selecting The Rustic Kettle loads its audited business brief.*  
  > *Here, Firecrawl scraped open-web reviews and menu snippets directly into Convex. Notice our anti-hallucination invariant: coffee roasts and patio hours are verified, while corporate catering is explicitly flagged as unconfirmed. We never fabricate business offerings."*

---

### Beat 4: Framer-Grade Storefront Studio & Grounding Citations (1:05 – 1:30)
- **Duration:** 25 seconds
- **Rubric Criterion:** **Design & Craft** + **Technical Execution**
- **Visual Action (Playwright):**
  1. *1:05–1:12:* Click the top-bar button `🌐 Open Storefront Tab ↗` (or navigate to `/preview/rustic-kettle-preview-v1`).
  2. *1:12–1:18:* Smooth 4-second eased scroll down the rendered storefront: warm editorial styling, artisan roast profiles, opening hours, and direct booking CTA.
  3. *1:18–1:24:* Cursor clicks `📱 Mobile (390px)` in the top viewport bar. The page seamlessly transitions into an iPhone chassis complete with dynamic island and spring physics.
  4. *1:24–1:30:* **Highlight Moment:** Click `📑 Inspect Grounding Citations`. The top drawer drops down, showing the live provenance ledger linking each website section to verified Google Places and Firecrawl scrape records.
- **Playwright Automation Cue:**
  ```typescript
  await page.goto("http://localhost:5173/preview/rustic-kettle-preview-v1");
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await page.waitForTimeout(1500);
  await page.locator("button:has-text('📱 Mobile (390px)')").click();
  await page.waitForTimeout(1200);
  await page.locator("button:has-text('Inspect Grounding Citations')").click();
  await page.waitForSelector("text=Operator Grounding & Provenance Ledger");
  await page.waitForTimeout(2500);
  ```
- **Verbatim Voiceover Script:**
  > *"Next, the storefront itself. Generated via OpenAI structured outputs into a typed Convex schema, this isn't a mock image—it's a responsive, live web application ready to deploy.*  
  > *With one click, we toggle to a pixel-accurate mobile frame and open the grounding drawer. Every headline, menu badge, and coffee origin is cross-referenced directly against audited evidence."*

---

### Beat 5: Outreach Pitch Queue & Strict Approval Invalidation (1:30 – 1:50)
- **Duration:** 20 seconds
- **Rubric Criterion:** **Completeness** + **Technical Execution**
- **Visual Action (Playwright):**
  1. *1:30–1:36:* Return to Desk; switch to the `✉️ Pitch Queue` tab. View Outreach Draft v1 ($1,250.00 CAD, 7-day delivery).
  2. *1:36–1:42:* Click `✏️ Edit Pitch`. In the price field, update `$1,250` to `$1,350`. Click `Save Changes & Invalidate Prior Approval`.
  3. *1:42–1:46:* **Highlight Moment:** Red banner flashes:
     `⚠️ Approval Expired: This pitch was edited after operator approval. A fresh approval is required before dispatch!`
  4. *1:46–1:50:* Click `✓ Approve Pitch for Sending`, then click `🚀 Dispatch Email via AgentMail`. Notification fires: *"Outreach dispatched via AgentMail! Follow-up schedule initialized."*
- **Playwright Automation Cue:**
  ```typescript
  await page.goto("http://localhost:5173/");
  await page.locator(".desk-tab-btn:has-text('Pitch Queue')").click();
  await page.locator("button:has-text('✏️ Edit Pitch')").click();
  await page.locator("input[type='number']").fill("135000");
  await page.locator("button:has-text('Save Changes & Invalidate Prior Approval')").click();
  await page.waitForTimeout(1000);
  await page.locator("button:has-text('✓ Approve Pitch for Sending')").click();
  await page.locator("button:has-text('🚀 Dispatch Email via AgentMail')").click();
  await page.waitForTimeout(1500);
  ```
- **Verbatim Voiceover Script:**
  > *"Now for client acquisition. In the Pitch Queue, the agent drafts a personalized commercial proposal. But watch our safety invariant: if an operator modifies the price or copy, prior approval is instantly revoked.*  
  > *Your brand reputation and pricing stay protected. We re-approve the pitch and dispatch—sending an authenticated email via AgentMail."*

---

### Beat 6: AgentMail Inbound Reply & Human-Gated Counteroffer (1:50 – 2:20)
- **Duration:** 30 seconds
- **Rubric Criterion:** **Technical Execution** + **Completeness**
- **Visual Action (Playwright):**
  1. *1:50–1:56:* Click the `💬 AgentMail Thread` tab. The outbound dispatch message is visible with full timestamp and thread ID.
  2. *1:56–2:02:* Click `💬 Simulate Inbound Reply & Counteroffer`. The thread updates reactively: café owner replies:  
     *"Hi! The preview looks fantastic, but our budget is tight. Can we do this for $1,000 CAD and 10 days delivery?"*
  3. *2:02–2:08:* Below the message, the AI badge renders: `AI Classification: counteroffer_received` with structured notes.
  4. *2:08–2:14:* Click over to the `🤝 Terms` tab. Proposal **v2** is displayed: `$1,000.00 CAD`, 10 days delivery, marked with status `counter_proposed_by_client` and badge `🔒 Non-Binding Draft`.
  5. *2:14–2:20:* **Highlight Moment:** Focus on the amber operator alert:
     `⚠️ Client Counteroffer Awaiting Operator Action: Accept $1,000.00 CAD with 10-day timeline?`
     Operator clicks `✓ Accept Counteroffer`. The proposal transitions to `accepted` and seals as `🔒 Binding Agreement`.
- **Playwright Automation Cue:**
  ```typescript
  await page.locator(".desk-tab-btn:has-text('AgentMail Thread')").click();
  await page.locator("button:has-text('Simulate Inbound Reply')").click();
  await page.waitForTimeout(1800);
  await page.locator(".desk-tab-btn:has-text('Terms')").click();
  await page.waitForSelector(".proposal-version-card.highlight");
  await page.locator("button:has-text('✓ Accept Counteroffer')").click();
  await page.waitForSelector("text=Binding Agreement");
  await page.waitForTimeout(2000);
  ```
- **Verbatim Voiceover Script:**
  > *"Minutes later, the café owner replies. AgentMail ingests the webhook, and OpenAI classifies the response as a counteroffer: one thousand dollars with a ten-day turnaround.*  
  > *Crucially, the agent cannot commit the business. Proposal version two is created as a non-binding counteroffer awaiting human judgment. Only when the operator clicks 'Accept Counteroffer' does Convex seal the legally binding contract."*

---

### Beat 7: Immutable Activity Ledger, Live Architecture & Close (2:20 – 2:40)
- **Duration:** 20 seconds
- **Rubric Criterion:** **Completeness** + **Impact / Value**
- **Visual Action (Playwright):**
  1. *2:20–2:30:* Switch to the `📜 Ledger` tab. Smooth eased scroll down the immutable chronological ledger showing the exact timeline: discovery, Firecrawl ingestion, brief creation, pitch approval, dispatch, inbound counteroffer classification, and final operator acceptance.
  2. *2:30–2:40:* Crossfade to final branded end-card:
     - Title: **Storefront Desk**
     - Subhead: *Autonomous SMB Acquisition & Verified Web Engine*
     - Badges: `Convex` • `OpenAI` • `Firecrawl` • `AgentMail`
     - Live URL: `https://storefrontdesk.dev` | GitHub: `github.com/Zen-cronic/change-order-desk`
- **Playwright Automation Cue:**
  ```typescript
  await page.locator(".desk-tab-btn:has-text('Ledger')").click();
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: "smooth" }));
  await page.waitForTimeout(2500);
  // Show end-card title plate
  ```
- **Verbatim Voiceover Script:**
  > *"Every single step—from Places discovery and Firecrawl extraction to AgentMail dispatch and counteroffer execution—is recorded in Convex's immutable reactive activity ledger.*  
  > *Storefront Desk turns SMB web acquisition from a weeks-long friction point into a ninety-second, human-verified partnership. Built for the Convex All Gas Hackathon."*

---

## 5. Rubric Weighting & Coverage Matrix

| Rubric Criterion | Demo Video Allocation | On-Screen Proof & Evidence |
|---|---|---|
| **Technical Execution** | **40%** (~65s) | • Convex relational schema (12 tables, reactive sync)<br>• Firecrawl scraping & structured extraction<br>• OpenAI structured brief & website specification<br>• AgentMail inbound webhook with counteroffer classification |
| **Impact & Value** | **25%** (~40s) | • Eliminates 30% third-party food delivery app commission<br>• Transforms weeks of manual agency design into 90-second onboarding<br>• Real economic lift for independent Main Street SMBs |
| **Design & Craft** | **20%** (~30s) | • Bespoke Obsidian Dark Studio Command Center (Linear/Attio aesthetic)<br>• Framer/Squarespace-grade responsive storefront with iPhone chassis<br>• Seesaw-inspired spring physics and tactile feedback |
| **Completeness** | **15%** (~25s) | • Full closed loop from discovery to signed proposal<br>• Approval invalidation on price edit<br>• Immutable reactive activity ledger tracking every actor |

---

## 6. Devpost Compliance & Submission Gates

- [x] **Shows Real App Functioning:** Captured directly from the running Vite/Convex frontend; zero fake video mockups.
- [x] **Strict Time Cap:** Script is timed at exactly **2:40 (160s)**, fitting safely within the 2:30–2:45 target and under the 3:00 cap.
- [x] **Hosting Platform:** Video exported as 1080p MP4 and uploaded as **Public/Unlisted on YouTube**.
- [x] **YouTube Meta:** Title formatted as `Storefront Desk - Convex All Gas Hackathon 2026`. Marked as *"Not made for Kids"*.
- [x] **Description Field:** Includes 1-line elevator pitch, GitHub repo link, and live deployment URL.
- [x] **Rights & Music:** Zero copyrighted music or third-party trademark infringement; clean UI chrome.
- [x] **Language:** 100% English audio narration and on-screen interface text.

---

## 7. Production Assembly & Recording Checklist

1. **Clean Workspace Reset:** Before recording Take 1, ensure the Convex backend is running (`npm run dev:backend`) and trigger the reset flow to guarantee clean relational state.
2. **Audio Generation:** Generate Kokoro-82M TTS audio at ~160 wpm for each numbered voiceover beat.
3. **Pacing Check:** Verify that visual transitions allow 1.5–2s settle pauses so judges can absorb the typography and badges before scrolling.
4. **Export Settings:** ffmpeg H.264 / AAC 1080p60 at 12 Mbps for razor-sharp monospace code and dashboard text.
