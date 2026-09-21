import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, "narration");
const VISUAL_DIR = path.join(__dirname, "visuals");
const BUILD_DIR = path.join(__dirname, "build");
const OUT_DIR = path.join(__dirname, "out");

fs.mkdirSync(BUILD_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

export interface SceneConfig {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  targetBudgetSeconds: number;
}

export const SCENES: SceneConfig[] = [
  {
    id: "beat_1_hook",
    image: path.join(VISUAL_DIR, "scene_1_hook.png"),
    title: "STOREFRONT DESK · THE SMB COMMISSION BLEED",
    subtitle: "Main Street SMBs Lose 30% to Delivery Apps · Instant Verified Digital Storefront",
    targetBudgetSeconds: 20,
  },
  {
    id: "beat_2_command_center",
    image: path.join(VISUAL_DIR, "scene_2_command_center.png"),
    title: "BESPOKE COMMAND CENTER · 4-SPONSOR ENGINE",
    subtitle: "Convex Relational DB · Firecrawl Scrapes · OpenAI Structured Engine · AgentMail",
    targetBudgetSeconds: 20,
  },
  {
    id: "beat_3_audit",
    image: path.join(VISUAL_DIR, "scene_3_audit.png"),
    title: "FIRECRAWL AUDIT · ANTI-HALLUCINATION INVARIANT",
    subtitle: "Scraped Open-Web Evidence · Unconfirmed Offerings Flagged Rather Than Fabricated",
    targetBudgetSeconds: 25,
  },
  {
    id: "beat_4_storefront",
    image: path.join(VISUAL_DIR, "scene_4_storefront.png"),
    title: "FRAMER-GRADE STOREFRONT STUDIO · GROUNDING CITATIONS",
    subtitle: "OpenAI Typed Convex Output · 390px Mobile Viewport · Live Provenance Drawer",
    targetBudgetSeconds: 25,
  },
  {
    id: "beat_5_pitch_queue",
    image: path.join(VISUAL_DIR, "scene_5_pitch_queue.png"),
    title: "COMMERCIAL SAFETY GATE · APPROVAL INVALIDATION",
    subtitle: "Approval Automatically Revoked on Price Edit · Operator Sign-Off Before Dispatch",
    targetBudgetSeconds: 20,
  },
  {
    id: "beat_6_counteroffer",
    image: path.join(VISUAL_DIR, "scene_6_counteroffer.png"),
    title: "AGENTMAIL INBOUND COUNTEROFFER · SOVEREIGN HUMAN GATE",
    subtitle: "AI Classifies $1,000 / 10-Day Offer · AI Strictly Barred From Binding Commercial Terms",
    targetBudgetSeconds: 30,
  },
  {
    id: "beat_7_ledger",
    image: path.join(VISUAL_DIR, "scene_7_ledger.png"),
    title: "IMMUTABLE ACTIVITY LEDGER · 12 RELATIONAL TABLES",
    subtitle: "Full Audit Trail: Discovery, Firecrawl Ingestion, Pitch Approval, Dispatch, & Binding Terms",
    targetBudgetSeconds: 12,
  },
  {
    id: "beat_8_closing",
    image: path.join(VISUAL_DIR, "scene_8_closing.png"),
    title: "STOREFRONT DESK · CONVEX ALL GAS HACKATHON 2026",
    subtitle: "Open Source · github.com/Zen-cronic/change-order-desk · MIT License",
    targetBudgetSeconds: 8,
  },
];

async function main() {
  console.log("=== Assembling Storefront Desk Demo Reel (Target: 2:40, Cap: ≤ 3:00) ===");

  const segmentList: string[] = [];
  let totalDemoDuration = 0;

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const rawAudioPath = path.join(AUDIO_DIR, `${scene.id}.mp3`);
    const timedAudioPath = path.join(BUILD_DIR, `${scene.id}_timed.mp3`);
    const segmentVideoPath = path.join(BUILD_DIR, `segment_${i + 1}.mp4`);

    if (!fs.existsSync(rawAudioPath)) {
      throw new Error(`Narration audio file missing: ${rawAudioPath}. Run 'npm run narration' first.`);
    }

    if (!fs.existsSync(scene.image)) {
      throw new Error(`Visual plate image missing: ${scene.image}. Run 'npm run plates' first.`);
    }

    // Measure raw duration
    const rawDurStr = execSync(
      `ffprobe -i "${rawAudioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString().trim();
    const rawDur = parseFloat(rawDurStr);

    // Compute optimal atempo factor (natural range 1.0 to 1.18)
    let tempo = 1.08;
    if (rawDur > scene.targetBudgetSeconds) {
      tempo = Math.min(1.20, Math.max(1.05, rawDur / scene.targetBudgetSeconds));
    }

    console.log(`\nProcessing Scene ${i + 1}: ${scene.title}...`);
    console.log(`Raw Audio: ${rawDur.toFixed(2)}s | Target Budget: ${scene.targetBudgetSeconds}s | Tempo: ${tempo.toFixed(2)}x`);

    execSync(
      `ffmpeg -y -i "${rawAudioPath}" -filter:a "atempo=${tempo.toFixed(3)}" -vn "${timedAudioPath}" 2>/dev/null`
    );

    const durStr = execSync(
      `ffprobe -i "${timedAudioPath}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString().trim();
    const duration = parseFloat(durStr);
    totalDemoDuration += duration;
    console.log(`Timed Segment Duration: ${duration.toFixed(2)}s`);

    // Format lower third overlay text
    const bannerText = scene.title.replace(/'/g, "").replace(/:/g, "\\:");
    const subText = scene.subtitle.replace(/'/g, "").replace(/:/g, "\\:");

    // Refined lower-thirds matching Obsidian Dark + Indigo accent
    const standardVf = [
      `scale=1920:1080`,
      `drawbox=x=0:y=920:w=1920:h=160:color=black@0.85:t=fill`,
      `drawbox=x=0:y=920:w=1920:h=4:color=#6366f1:t=fill`,
      `drawtext=text='${bannerText}':fontcolor=white:fontsize=30:x=60:y=948`,
      `drawtext=text='${subText}':fontcolor=#94a3b8:fontsize=20:x=60:y=996`,
    ].join(",");

    execSync(
      `ffmpeg -y -loop 1 -i "${scene.image}" -i "${timedAudioPath}" -vf "${standardVf}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${duration} "${segmentVideoPath}" 2>/dev/null`
    );

    segmentList.push(segmentVideoPath);
    console.log(`✓ Rendered Segment ${i + 1}: ${segmentVideoPath}`);
  }

  // Create concat file list
  const concatFilePath = path.join(BUILD_DIR, "concat_list.txt");
  const concatContent = segmentList.map((p) => `file '${p}'`).join("\n");
  fs.writeFileSync(concatFilePath, concatContent);

  const finalVideoPath = path.join(OUT_DIR, "storefront-desk-demo-reel.mp4");
  console.log(`\nConcatenating ${segmentList.length} segments into ${finalVideoPath}...`);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${finalVideoPath}" 2>/dev/null`
  );

  const finalDurStr = execSync(
    `ffprobe -i "${finalVideoPath}" -show_entries format=duration -v quiet -of csv="p=0"`
  ).toString().trim();
  const finalDuration = parseFloat(finalDurStr);
  const fileSize = fs.statSync(finalVideoPath).size;

  console.log("\n=======================================================");
  console.log(`🎥 DEMO REEL SUCCESSFULLY ASSEMBLED!`);
  console.log(`File: ${finalVideoPath}`);
  console.log(
    `Duration: ${finalDuration.toFixed(2)}s (${Math.floor(finalDuration / 60)}m ${(finalDuration % 60).toFixed(0)}s) [Hard Cap: ≤ 3:00 / 180s]`
  );
  console.log(`File Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log("=======================================================\n");
}

if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error("Assembly failed:", err);
    process.exit(1);
  });
}
