import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env.local is loaded if present
const envLocalPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const VOICE_NAME = process.env.GEMINI_TTS_VOICE || "Puck";

export interface BeatDefinition {
  id: string;
  title: string;
  targetDurationSeconds: number;
  timestampRange: string;
  text: string;
}

export const BEATS: BeatDefinition[] = [
  {
    id: "beat_1_hook",
    title: "Beat 1: Cold Open: The SMB Commission Bleed",
    targetDurationSeconds: 20,
    timestampRange: "0:00–0:20",
    text: "Every day, thousands of beloved local restaurants like Toronto's Rustic Kettle lose thirty percent of their margin to third-party delivery apps—simply because building a custom web presence takes weeks of agency back-and-forth. What if an operator could discover them, verify their public facts without hallucinating, generate a production-ready storefront, and negotiate the outreach deal—in under ninety seconds?",
  },
  {
    id: "beat_2_command_center",
    title: "Beat 2: Identity, Studio Command Center & 4-Sponsor Engine",
    targetDurationSeconds: 20,
    timestampRange: "0:20–0:40",
    text: "Meet Storefront Desk: an agent-assisted customer acquisition workstation built on Convex, powered by Firecrawl, OpenAI, and AgentMail. With one click, Convex resets and provisions our workspace, orchestrating twelve relational tables in real time. The model never runs unguided: human operators maintain complete sovereign authority.",
  },
  {
    id: "beat_3_audit",
    title: "Beat 3: Places Discovery & Anti-Hallucination Firecrawl Audit",
    targetDurationSeconds: 25,
    timestampRange: "0:40–1:05",
    text: "Discovery begins on Google Places, targeting high-reputation SMBs lacking an owned website. Selecting The Rustic Kettle loads its audited business brief. Here, Firecrawl scraped open-web reviews and menu snippets directly into Convex. Notice our anti-hallucination invariant: coffee roasts and patio hours are verified, while corporate catering is explicitly flagged as unconfirmed. We never fabricate business offerings.",
  },
  {
    id: "beat_4_storefront",
    title: "Beat 4: Framer-Grade Storefront Studio & Grounding Citations",
    targetDurationSeconds: 25,
    timestampRange: "1:05–1:30",
    text: "Next, the storefront itself. Generated via OpenAI structured outputs into a typed Convex schema, this isn't a mock image—it's a responsive, live web application ready to deploy. With one click, we toggle to a pixel-accurate mobile frame and open the grounding drawer. Every headline, menu badge, and coffee origin is cross-referenced directly against audited evidence.",
  },
  {
    id: "beat_5_pitch_queue",
    title: "Beat 5: Outreach Pitch Queue & Strict Approval Invalidation",
    targetDurationSeconds: 20,
    timestampRange: "1:30–1:50",
    text: "Now for client acquisition. In the Pitch Queue, the agent drafts a personalized commercial proposal. But watch our safety invariant: if an operator modifies the price or copy, prior approval is instantly revoked. Your brand reputation and pricing stay protected. We re-approve the pitch and dispatch—sending an authenticated email via AgentMail.",
  },
  {
    id: "beat_6_counteroffer",
    title: "Beat 6: AgentMail Inbound Reply & Human-Gated Counteroffer",
    targetDurationSeconds: 30,
    timestampRange: "1:50–2:20",
    text: "Minutes later, the café owner replies. AgentMail ingests the webhook, and OpenAI classifies the response as a counteroffer: one thousand dollars with a ten-day turnaround. Crucially, the agent cannot commit the business. Proposal version two is created as a non-binding counteroffer awaiting human judgment. Only when the operator clicks 'Accept Counteroffer' does Convex seal the legally binding contract.",
  },
  {
    id: "beat_7_ledger",
    title: "Beat 7: Immutable Activity Ledger & Reactive Architecture",
    targetDurationSeconds: 12,
    timestampRange: "2:20–2:32",
    text: "Every single step—from Places discovery and Firecrawl extraction to AgentMail dispatch and counteroffer execution—is recorded in Convex's immutable reactive activity ledger.",
  },
  {
    id: "beat_8_closing",
    title: "Beat 8: Wrap-Up, Hackathon Attribution & Open Source Close",
    targetDurationSeconds: 8,
    timestampRange: "2:32–2:40",
    text: "Storefront Desk turns SMB web acquisition from a weeks-long friction point into a ninety-second, human-verified partnership. Built for the Convex All Gas Hackathon.",
  },
];

async function tryGeminiTTS(beat: BeatDefinition, tempPcmPath: string, mp3Path: string): Promise<boolean> {
  if (!GEMINI_API_KEY) return false;
  try {
    console.log(`Synthesizing ${beat.title} via Gemini TTS (${TTS_MODEL}, voice: ${VOICE_NAME})...`);
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: beat.text,
        response_format: { type: "audio" },
        generation_config: {
          speech_config: [
            { voice: VOICE_NAME },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Gemini TTS API returned ${response.status}: ${errText}`);
      return false;
    }

    const data = (await response.json()) as any;
    const content = data?.steps?.[0]?.content?.[0];
    if (!content || !content.data) {
      console.warn("Gemini TTS response missing audio payload");
      return false;
    }

    const pcmBuffer = Buffer.from(content.data, "base64");
    fs.writeFileSync(tempPcmPath, pcmBuffer);

    const ffmpegResult = spawnSync("ffmpeg", [
      "-y",
      "-f", "s16le",
      "-ar", "24000",
      "-ac", "1",
      "-i", tempPcmPath,
      "-c:a", "libmp3lame",
      "-b:a", "192k",
      mp3Path,
    ]);

    if (ffmpegResult.status !== 0) {
      console.warn(`FFmpeg PCM encoding failed: ${ffmpegResult.stderr?.toString()}`);
      return false;
    }

    fs.rmSync(tempPcmPath, { force: true });
    return true;
  } catch (err: any) {
    console.warn(`Gemini TTS failed: ${err.message}`);
    return false;
  }
}

async function tryOpenAITTS(beat: BeatDefinition, mp3Path: string): Promise<boolean> {
  if (!OPENAI_API_KEY) return false;
  try {
    console.log(`Synthesizing ${beat.title} via OpenAI TTS (tts-1, voice: onyx)...`);
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "onyx",
        input: beat.text,
      }),
    });

    if (!response.ok) {
      console.warn(`OpenAI TTS API returned ${response.status}`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(mp3Path, Buffer.from(arrayBuffer));
    return true;
  } catch (err: any) {
    console.warn(`OpenAI TTS failed: ${err.message}`);
    return false;
  }
}

function tryEspeakFallback(beat: BeatDefinition, mp3Path: string): boolean {
  try {
    console.log(`Generating fallback offline narration for ${beat.title} via eSpeak...`);
    const tempWav = mp3Path.replace(/\.mp3$/, ".wav");
    const espeakRes = spawnSync("espeak", [
      "-s", "165",
      "-v", "en-us",
      "-w", tempWav,
      beat.text,
    ]);

    if (espeakRes.status !== 0) {
      console.warn(`eSpeak failed: ${espeakRes.stderr?.toString()}`);
      return false;
    }

    const ffmpegRes = spawnSync("ffmpeg", [
      "-y",
      "-i", tempWav,
      "-c:a", "libmp3lame",
      "-b:a", "192k",
      mp3Path,
    ]);

    fs.rmSync(tempWav, { force: true });
    return ffmpegRes.status === 0;
  } catch (err: any) {
    console.warn(`eSpeak fallback failed: ${err.message}`);
    return false;
  }
}

async function generateBeat(beat: BeatDefinition, outputDir: string) {
  const filePath = path.join(outputDir, `${beat.id}.mp3`);
  const tempPcmPath = path.join(outputDir, `${beat.id}.pcm`);

  let success = await tryGeminiTTS(beat, tempPcmPath, filePath);
  if (!success) {
    success = await tryOpenAITTS(beat, filePath);
  }
  if (!success) {
    success = tryEspeakFallback(beat, filePath);
  }

  if (!success || !fs.existsSync(filePath)) {
    throw new Error(`Failed to generate audio for ${beat.title}`);
  }

  const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const duration = parseFloat(execSync(ffprobeCmd).toString().trim());

  console.log(`✓ Saved ${filePath} (${duration.toFixed(2)}s, budget: ${beat.targetDurationSeconds}s)`);
  return {
    id: beat.id,
    title: beat.title,
    file: filePath,
    duration,
    targetDurationSeconds: beat.targetDurationSeconds,
    timestampRange: beat.timestampRange,
    text: beat.text,
  };
}

async function main() {
  const outputDir = path.resolve(__dirname, "narration");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`=== Generating Storefront Desk Demo Voiceover (${BEATS.length} Beats) ===`);
  console.log(`Target Total Runtime: 160.00s (2:40) [Hard Cap: ≤ 180s]`);

  const manifest = [];
  for (const beat of BEATS) {
    const info = await generateBeat(beat, outputDir);
    manifest.push(info);
  }

  const totalDuration = manifest.reduce((acc, b) => acc + b.duration, 0);
  console.log(
    `\nTotal Voiced Duration: ${totalDuration.toFixed(2)}s (${Math.floor(totalDuration / 60)}m ${(totalDuration % 60).toFixed(0)}s)`
  );

  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify({ beats: manifest, totalDuration }, null, 2));
  console.log(`Manifest saved to ${manifestPath}`);
}

if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error("Error generating voiceover:", err);
    process.exit(1);
  });
}
