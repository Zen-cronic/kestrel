# Storefront Desk — Demo Video Production Pipeline

Automated demo director package and production pipeline for **Storefront Desk** (Convex All Gas Hackathon 2026).

This pipeline deterministically captures high-resolution 1080p visual plates of the live application with Playwright, synthesizes voiceover beats (via Gemini TTS / OpenAI / local fallback), stitches them with ffmpeg lower-thirds into a master reel, and enforces strict hackathon compliance gates (hard cap ≤ 3:00, target envelope ≤ 2:45, 1080p H.264, AAC audio).

---

## Versioned Outputs

- `out/storefront-desk-demo-reel.mp4` — Master 1080p demo video candidate
- `out/storefront-desk-demo-reel-verification.json` — Automated compliance report covering duration, resolution, codecs, and media presence
- `visuals/scene_*.png` — 8 high-resolution 1920×1080 visual plates captured from the running application
- `narration/beat_*.mp3` — 8 studio-quality narration beats generated via Gemini TTS (`gemini-3.1-flash-tts-preview`, voice `Puck`) with automatic local fallback
- `narration/manifest.json` — Timestamps, duration, and text ledger for all 8 beats

---

## The 8 Directed Beats & Timings

| Beat | Title | Target Seconds | Key Visual Action | Rubric Axis |
|---|---|---|---|---|
| **Beat 1** | Cold Open: SMB Commission Bleed | 0:00–0:20 (20s) | Google Places listing (30% commission bleed) vs Instant Verified Storefront | Impact / Value |
| **Beat 2** | Studio Command Center | 0:20–0:40 (20s) | Click `⚡ Reset Hero Flow` across 12 reactive Convex tables | Design & Craft / Technical |
| **Beat 3** | Places Discovery & Audit | 0:40–1:05 (25s) | Firecrawl open-web audit & anti-hallucination unconfirmed flag | Technical Execution |
| **Beat 4** | Framer-Grade Storefront Studio | 1:05–1:30 (25s) | Responsive preview, iPhone 390px chassis, and Grounding Drawer | Design & Craft / Technical |
| **Beat 5** | Pitch Queue & Invalidation | 1:30–1:50 (20s) | Edit pitch price; approval revokes; re-approve and dispatch | Completeness / Technical |
| **Beat 6** | Inbound Reply & Counteroffer | 1:50–2:20 (30s) | Inbound counteroffer classification; sovereign human approval gate | Technical / Completeness |
| **Beat 7** | Immutable Activity Ledger | 2:20–2:32 (12s) | Real-time reactive chronological audit log in Convex | Completeness / Impact |
| **Beat 8** | Close & Open Source | 2:32–2:40 (8s) | High-impact branded slate with 4-sponsor stack & GitHub links | Completeness / Presentation |

---

## Directory Layout

```
film/
├── package.json               # Script runner for film commands
├── README.md                  # Pipeline documentation and usage instructions
├── record-plates.ts           # Playwright 1080p visual plate capture against live app
├── generate-narration.ts      # Multi-tier TTS speech generator (Gemini / OpenAI / eSpeak)
├── assemble-reel.ts           # Beat-matched FFmpeg assembly & subtle lower-thirds
├── verify-reel.ts             # Strict compliance verification gate (duration, codecs, 1080p)
├── narration/                 # Generated audio files and manifest.json
├── visuals/                   # 1920×1080 captured plates
├── build/                     # Timed intermediate audio clips and video segments
└── out/                       # Master demo reel and verification JSON report
```

---

## Quick Commands

Run from the `film/` directory:

```bash
# 1. Capture visual plates from the running app (http://localhost:5174)
npm run plates

# 2. Synthesize all 8 narration beats matching DEMO_RUN_OF_SHOW.md
npm run narration

# 3. Assemble all 8 segments with ffmpeg into the master reel
npm run assemble

# 4. Verify quality and compliance gates (duration, resolution, audio, plates)
npm run verify

# Complete End-to-End Build (Assemble + Verify)
npm run build-film
```

Or from the repository root:

```bash
npm run film:plates
npm run film:narration
npm run film:assemble
npm run film:verify
npm run film:build
```

---

## Compliance Gates & Rules

- **Shows Real Functioning App:** Captured directly from the running Vite/Convex frontend at 1920×1080.
- **Strict Cap:** Hard cap ≤ 3:00 (180s); target envelope 2:30–2:45 (150–165s).
- **Audio Codec:** Stereo AAC mastered cleanly.
- **Video Codec:** H.264 MP4 1080p (1920×1080).
- **Ethical Safety:** Invariant enforcement highlighted on-camera (anti-hallucination flags, approval invalidation on edit, and human sovereign authority over financial agreements).
