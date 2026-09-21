import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProbeStream {
  codec_type: string;
  codec_name: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  sample_rate?: string;
  channels?: number;
}

interface ProbeResult {
  streams: ProbeStream[];
  format: {
    duration: string;
    size: string;
    bit_rate: string;
    format_name: string;
  };
}

async function verify() {
  console.log("=== Storefront Desk Demo Reel Verification Gate ===");
  const videoPath = path.join(__dirname, "out", "storefront-desk-demo-reel.mp4");

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Master demo reel does not exist at ${videoPath}. Run 'npm run assemble' first.`);
  }

  const probeJson = execSync(
    `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
  ).toString();
  const info: ProbeResult = JSON.parse(probeJson);

  const videoStream = info.streams.find((s) => s.codec_type === "video");
  const audioStream = info.streams.find((s) => s.codec_type === "audio");
  const duration = parseFloat(info.format.duration);
  const sizeBytes = parseInt(info.format.size, 10);
  const sizeMB = sizeBytes / (1024 * 1024);

  const checks: Array<{ name: string; pass: boolean; details: string }> = [];

  // Check 1: Hard 3:00 Duration Cap (≤ 180.00s)
  checks.push({
    name: "Hard 3:00 Duration Cap",
    pass: duration <= 180.0,
    details: `${duration.toFixed(2)}s (Hard Cap: 180.00s / 3:00)`,
  });

  // Check 2: Target Envelope (≤ 2:45 / 165.00s)
  checks.push({
    name: "Target Duration Envelope (≤ 2:45)",
    pass: duration <= 165.0,
    details: `${duration.toFixed(2)}s (Target Envelope: ≤ 165.00s / 2:45)`,
  });

  // Check 3: Video Resolution (1920x1080)
  checks.push({
    name: "1080p Resolution",
    pass: videoStream?.width === 1920 && videoStream?.height === 1080,
    details: `${videoStream?.width}x${videoStream?.height} (Required: 1920x1080)`,
  });

  // Check 4: Video Codec
  checks.push({
    name: "H.264 Video Codec",
    pass: videoStream?.codec_name === "h264",
    details: `Codec: ${videoStream?.codec_name}`,
  });

  // Check 5: Audio Track Presence
  checks.push({
    name: "AAC Audio Track",
    pass: audioStream?.codec_name === "aac",
    details: `Audio Codec: ${audioStream?.codec_name}, Sample Rate: ${audioStream?.sample_rate} Hz`,
  });

  // Check 6: File size reasonable for submission (< 100MB)
  checks.push({
    name: "File Size Compliance",
    pass: sizeMB > 1.0 && sizeMB < 100.0,
    details: `${sizeMB.toFixed(2)} MB`,
  });

  // Check 7: Visual plates presence
  const plates = [
    "scene_1_hook.png",
    "scene_2_command_center.png",
    "scene_3_audit.png",
    "scene_4_storefront.png",
    "scene_5_pitch_queue.png",
    "scene_6_counteroffer.png",
    "scene_7_ledger.png",
    "scene_8_closing.png",
  ];
  const missingPlates = plates.filter(
    (p) => !fs.existsSync(path.join(__dirname, "visuals", p))
  );
  checks.push({
    name: "All 8 Visual Plates Present",
    pass: missingPlates.length === 0,
    details: missingPlates.length === 0 ? "8/8 plates verified" : `Missing: ${missingPlates.join(", ")}`,
  });

  // Check 8: Narration beats presence
  const beats = [
    "beat_1_hook.mp3",
    "beat_2_command_center.mp3",
    "beat_3_audit.mp3",
    "beat_4_storefront.mp3",
    "beat_5_pitch_queue.mp3",
    "beat_6_counteroffer.mp3",
    "beat_7_ledger.mp3",
    "beat_8_closing.mp3",
  ];
  const missingBeats = beats.filter(
    (b) => !fs.existsSync(path.join(__dirname, "narration", b))
  );
  checks.push({
    name: "All 8 Narration Audio Beats Present",
    pass: missingBeats.length === 0,
    details: missingBeats.length === 0 ? "8/8 beats verified" : `Missing: ${missingBeats.join(", ")}`,
  });

  let allPass = true;
  for (const c of checks) {
    const symbol = c.pass ? "✅ PASS" : "❌ FAIL";
    console.log(`[${symbol}] ${c.name}: ${c.details}`);
    if (!c.pass) allPass = false;
  }

  const verificationReport = {
    verifiedAt: new Date().toISOString(),
    videoPath,
    durationSeconds: duration,
    formattedDuration: `${Math.floor(duration / 60)}m ${(duration % 60).toFixed(1)}s`,
    fileSizeBytes: sizeBytes,
    fileSizeMB: sizeMB,
    video: {
      width: videoStream?.width,
      height: videoStream?.height,
      codec: videoStream?.codec_name,
      framerate: videoStream?.r_frame_rate,
    },
    audio: {
      codec: audioStream?.codec_name,
      sampleRate: audioStream?.sample_rate,
      channels: audioStream?.channels,
    },
    checks,
    status: allPass ? "PASSED" : "FAILED",
  };

  const reportPath = path.join(__dirname, "out", "storefront-desk-demo-reel-verification.json");
  fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
  console.log(`\nVerification report saved to: ${reportPath}`);

  if (!allPass) {
    throw new Error("One or more verification checks failed.");
  }
  console.log("\n🎉 ALL VERIFICATION CHECKS PASSED!");
}

if (process.argv[1] === __filename) {
  verify().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
