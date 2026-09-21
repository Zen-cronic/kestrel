import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const outputDir = path.resolve(__dirname, "visuals");
  fs.mkdirSync(outputDir, { recursive: true });

  const BASE_URL = process.env.BASE_URL || "http://localhost:5174";
  console.log(`Launching Chromium browser to capture 8 demo plates from ${BASE_URL} at 1920x1080...`);

  // Detect available Chrome / Chromium executable
  const chromePath =
    process.env.CHROME_PATH ||
    (fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
      "--kiosk",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // =========================================================================
  // 1. Scene 1: Cold Open: The SMB Commission Bleed (Split Contrast)
  // =========================================================================
  console.log("Capturing Scene 1: Cold Open Comparison (Google Places 30% Bleed vs Instant Storefront)...");
  const coldOpenHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            width: 1920px;
            height: 1080px;
            background: #090d16;
            color: #f8fafc;
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
          }
          .bg-glow-left {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%);
            top: 15%;
            left: 5%;
            filter: blur(80px);
            z-index: 1;
          }
          .bg-glow-right {
            position: absolute;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
            top: 15%;
            right: 5%;
            filter: blur(90px);
            z-index: 1;
          }
          .header {
            position: relative;
            z-index: 2;
            padding: 44px 80px 20px;
            text-align: center;
          }
          .hook-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            border-radius: 9999px;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #fca5a5;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 16px;
          }
          .title {
            font-size: 46px;
            font-weight: 900;
            letter-spacing: -0.02em;
            margin: 0 0 10px;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .subtitle {
            font-size: 20px;
            color: #94a3b8;
            margin: 0;
          }
          .split-container {
            position: relative;
            z-index: 2;
            display: flex;
            gap: 48px;
            padding: 24px 80px 48px;
            flex: 1;
          }
          .side-panel {
            flex: 1;
            border-radius: 20px;
            padding: 32px 36px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .left-panel {
            background: rgba(24, 18, 24, 0.7);
            border: 1px solid rgba(239, 68, 68, 0.35);
            box-shadow: 0 20px 40px -10px rgba(239, 68, 68, 0.15);
          }
          .right-panel {
            background: rgba(13, 27, 24, 0.7);
            border: 1px solid rgba(16, 185, 129, 0.35);
            box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.15);
          }
          .panel-tag {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 12px;
          }
          .card-headline {
            font-size: 28px;
            font-weight: 800;
            margin: 0 0 8px;
            color: #ffffff;
          }
          .meta-row {
            display: flex;
            gap: 12px;
            font-size: 15px;
            color: #94a3b8;
            margin-bottom: 24px;
          }
          .warning-box {
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            font-size: 15px;
            color: #fecaca;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .success-box {
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            font-size: 15px;
            color: #a7f3d0;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .metric-row {
            display: flex;
            gap: 20px;
            margin-top: auto;
          }
          .metric-cell {
            flex: 1;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 18px 20px;
          }
          .metric-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          }
          .metric-value {
            font-size: 32px;
            font-weight: 900;
            font-family: 'JetBrains Mono', monospace;
          }
          .mv-red { color: #f87171; }
          .mv-green { color: #34d399; }
          .versus-badge {
            position: absolute;
            left: 50%;
            top: 55%;
            transform: translate(-50%, -50%);
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: #0f172a;
            border: 2px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 16px;
            color: #cbd5e1;
            z-index: 10;
            box-shadow: 0 0 24px rgba(0,0,0,0.8);
          }
        </style>
      </head>
      <body>
        <div class="bg-glow-left"></div>
        <div class="bg-glow-right"></div>
        <div class="header">
          <div class="hook-pill">⚠️ The SMB Digital Dilemma</div>
          <h1 class="title">Main Street SMBs Bleed 30% to Delivery Platforms</h1>
          <p class="subtitle">Weeks of manual agency design vs 90-second verified storefront acquisition</p>
        </div>
        <div class="split-container">
          <div class="side-panel left-panel">
            <div>
              <div class="panel-tag" style="color: #f87171;">❌ Google Places Status Quo</div>
              <h2 class="card-headline">The Rustic Kettle Café & Roastery</h2>
              <div class="meta-row">
                <span>⭐ 4.6 Stars (187 Reviews)</span>
                <span>•</span>
                <span>West Queen West, Toronto</span>
              </div>
              <div class="warning-box">
                <strong>⚠️ Vulnerability Detected:</strong> No first-party website detected on Google Places.<br>
                Forced to rely on marketplace delivery aggregators taking up to 30% on every order.
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-cell">
                <div class="metric-label">Marketplace Fee</div>
                <div class="metric-value mv-red">-30.0%</div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Agency Setup</div>
                <div class="metric-value mv-red">4+ Weeks</div>
              </div>
            </div>
          </div>

          <div class="versus-badge">VS</div>

          <div class="side-panel right-panel">
            <div>
              <div class="panel-tag" style="color: #34d399;">⚡ Storefront Desk Solution</div>
              <h2 class="card-headline">Direct Verified Web Storefront</h2>
              <div class="meta-row">
                <span>Convex Relational Host</span>
                <span>•</span>
                <span>Audited Open-Web Evidence</span>
              </div>
              <div class="success-box">
                <strong>✓ Owned Digital Asset:</strong> Instant mobile-first web storefront deployed to Convex.<br>
                Zero-commission direct customer ordering, verified menu items, and artisanal branding.
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-cell">
                <div class="metric-label">Direct Commission</div>
                <div class="metric-value mv-green">0.0%</div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Time to Live</div>
                <div class="metric-value mv-green">90 Sec</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
  const s1Page = await context.newPage();
  await s1Page.setContent(coldOpenHtml, { waitUntil: "networkidle" });
  await s1Page.waitForTimeout(1000);
  await s1Page.screenshot({ path: path.join(outputDir, "scene_1_hook.png") });
  await s1Page.close();

  // =========================================================================
  // 2. Scene 2: Identity, Studio Command Center & 4-Sponsor Engine
  // =========================================================================
  console.log("Capturing Scene 2: Command Center & 4-Sponsor Engine...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Click Reset Hero Flow to provision clean 12-table relational state
  const resetBtn = page.locator("button:has-text('Reset Hero Flow')");
  if (await resetBtn.isVisible()) {
    console.log("Clicking ⚡ Reset Hero Flow...");
    await resetBtn.click();
    await page.waitForTimeout(2000);
  }

  // Ensure candidate items are loaded
  await page.waitForSelector(".candidate-item-card", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, "scene_2_command_center.png") });

  // =========================================================================
  // 3. Scene 3: Places Discovery & Anti-Hallucination Firecrawl Audit
  // =========================================================================
  console.log("Capturing Scene 3: Grounded Brief & Anti-Hallucination Invariant...");
  const briefTab = page.locator(".desk-tab-btn:has-text('Grounded Brief')");
  if (await briefTab.isVisible()) {
    await briefTab.click();
    await page.waitForTimeout(1200);
  }

  // Scroll down slightly so the amber anti-hallucination warning is prominently framed
  const unconfirmedCallout = page.locator("strong:has-text('Explicitly Unconfirmed Details')");
  if (await unconfirmedCallout.isVisible()) {
    await unconfirmedCallout.scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, "scene_3_audit.png") });

  // =========================================================================
  // 4. Scene 4: Responsive Storefront Studio & Citations
  // =========================================================================
  console.log("Capturing Scene 4: Responsive Storefront Studio & Grounding Citations Drawer...");
  await page.goto(`${BASE_URL}/preview/rustic-kettle-preview-v1`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=VERIFIED SMB PREVIEW", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Toggle mobile viewport
  const mobileBtn = page.locator("button:has-text('Mobile (390px)')");
  if (await mobileBtn.isVisible()) {
    await mobileBtn.click();
    await page.waitForTimeout(1000);
  }

  // Open citations drawer
  const inspectBtn = page.locator("button:has-text('Inspect Grounding Citations')");
  if (await inspectBtn.isVisible()) {
    await inspectBtn.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: path.join(outputDir, "scene_4_storefront.png") });

  // =========================================================================
  // 5. Scene 5: Outreach Pitch Queue & Strict Approval Invalidation
  // =========================================================================
  console.log("Capturing Scene 5: Pitch Queue & Approval Invalidation Guardrail...");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const pitchTab = page.locator(".desk-tab-btn:has-text('Pitch Queue')");
  if (await pitchTab.isVisible()) {
    await pitchTab.click();
    await page.waitForTimeout(1000);
  }

  // Edit pitch price to trigger invalidation guardrail
  const editBtn = page.locator("button:has-text('Edit Pitch')");
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(500);
    const numInput = page.locator("input[type='number']");
    if (await numInput.isVisible()) {
      await numInput.fill("135000");
    }
    const saveBtn = page.locator("button:has-text('Save Changes')");
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: path.join(outputDir, "scene_5_pitch_queue.png") });

  // Re-approve and dispatch via AgentMail to advance pipeline
  const approveBtn = page.locator("button:has-text('Approve Pitch')");
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    await page.waitForTimeout(800);
  }
  const dispatchBtn = page.locator("button:has-text('Dispatch Email via AgentMail')");
  if (await dispatchBtn.isVisible()) {
    await dispatchBtn.click();
    await page.waitForTimeout(1500);
  }

  // =========================================================================
  // 6. Scene 6: AgentMail Inbound Reply & Human-Gated Counteroffer
  // =========================================================================
  console.log("Capturing Scene 6: Inbound Reply, AI Classification & Human Sovereign Gate...");
  const threadTab = page.locator(".desk-tab-btn:has-text('AgentMail Thread')");
  if (await threadTab.isVisible()) {
    await threadTab.click();
    await page.waitForTimeout(1000);
  }

  const simReplyBtn = page.locator("button:has-text('Simulate Inbound Reply')");
  if (await simReplyBtn.isVisible()) {
    await simReplyBtn.click();
    await page.waitForTimeout(1500);
  }

  const termsTab = page.locator(".desk-tab-btn:has-text('Terms')");
  if (await termsTab.isVisible()) {
    await termsTab.click();
    await page.waitForTimeout(1200);
  }

  // Focus on proposal v2 card
  const acceptBtn = page.locator("button:has-text('Accept Counteroffer')");
  if (await acceptBtn.isVisible()) {
    await acceptBtn.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: path.join(outputDir, "scene_6_counteroffer.png") });

  // =========================================================================
  // 7. Scene 7: Immutable Activity Ledger
  // =========================================================================
  console.log("Capturing Scene 7: Immutable Activity Ledger across 12 Convex Tables...");
  const ledgerTab = page.locator(".desk-tab-btn:has-text('Ledger')");
  if (await ledgerTab.isVisible()) {
    await ledgerTab.click();
    await page.waitForTimeout(1200);
  }
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, "scene_7_ledger.png") });

  // =========================================================================
  // 8. Scene 8: High-Impact Architecture & Close Slate
  // =========================================================================
  console.log("Capturing Scene 8: High-Impact Closing Title Slate...");
  const closingHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            width: 1920px;
            height: 1080px;
            background: #070b14;
            color: white;
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          .bg-glow {
            position: absolute;
            width: 1100px;
            height: 700px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(16, 185, 129, 0.1) 45%, transparent 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            filter: blur(90px);
            z-index: 1;
          }
          .content {
            position: relative;
            z-index: 2;
            text-align: center;
            max-width: 1300px;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 22px;
            border-radius: 9999px;
            background: rgba(30, 41, 59, 0.85);
            border: 1px solid rgba(99, 102, 241, 0.4);
            color: #a5b4fc;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          .title {
            font-size: 80px;
            font-weight: 900;
            letter-spacing: -0.03em;
            margin: 0 0 16px 0;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .tagline {
            font-size: 26px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 52px;
          }
          .stack-grid {
            display: flex;
            gap: 24px;
            justify-content: center;
            margin-bottom: 56px;
          }
          .card {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(51, 65, 85, 0.9);
            border-radius: 16px;
            padding: 22px 28px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 250px;
            box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6);
          }
          .card-title {
            font-size: 19px;
            font-weight: 800;
            color: #f8fafc;
          }
          .card-sub {
            font-size: 13px;
            color: #94a3b8;
            text-align: center;
          }
          .convex-accent { border-color: rgba(239, 68, 68, 0.45); }
          .convex-text { color: #f87171; }
          .fc-accent { border-color: rgba(249, 115, 22, 0.45); }
          .fc-text { color: #fb923c; }
          .ai-accent { border-color: rgba(99, 102, 241, 0.45); }
          .ai-text { color: #818cf8; }
          .mail-accent { border-color: rgba(16, 185, 129, 0.45); }
          .mail-text { color: #34d399; }
          .links {
            display: flex;
            gap: 32px;
            justify-content: center;
            align-items: center;
            color: #cbd5e1;
            font-size: 17px;
            font-weight: 600;
          }
          .link-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        </style>
      </head>
      <body>
        <div class="bg-glow"></div>
        <div class="content">
          <div class="badge">Convex All Gas Hackathon 2026</div>
          <h1 class="title">Storefront Desk</h1>
          <p class="tagline">Autonomous SMB Acquisition & Verified Web Engine • Sovereign Human-in-the-Loop</p>
          <div class="stack-grid">
            <div class="card convex-accent">
              <span class="card-title convex-text">Convex Platform</span>
              <span class="card-sub">12 Reactive Relational Tables & Real-Time Sync</span>
            </div>
            <div class="card fc-accent">
              <span class="card-title fc-text">Firecrawl Web Audit</span>
              <span class="card-sub">Menu Scrapes & Anti-Hallucination Invariant</span>
            </div>
            <div class="card ai-accent">
              <span class="card-title ai-text">OpenAI SDK</span>
              <span class="card-sub">Structured Briefs & Framer-Grade Specifications</span>
            </div>
            <div class="card mail-accent">
              <span class="card-title mail-text">AgentMail Dispatch</span>
              <span class="card-sub">Webhook Counteroffers & Commercial Gate</span>
            </div>
          </div>
          <div class="links">
            <span class="link-item">📦 github.com/Zen-cronic/change-order-desk</span>
            <span style="color: #475569;">•</span>
            <span class="link-item">⚡ 100% Relational Convex Architecture</span>
            <span style="color: #475569;">•</span>
            <span class="link-item">🛡️ Invariant-Backed Commercial Safety</span>
          </div>
        </div>
      </body>
    </html>
  `;
  const closingPage = await context.newPage();
  await closingPage.setContent(closingHtml, { waitUntil: "networkidle" });
  await closingPage.waitForTimeout(1000);
  await closingPage.screenshot({ path: path.join(outputDir, "scene_8_closing.png") });
  await closingPage.close();

  console.log("All 8 demo plates captured successfully in 1920x1080!");
  await browser.close();
}

if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error("Error capturing demo plates:", err);
    process.exit(1);
  });
}
