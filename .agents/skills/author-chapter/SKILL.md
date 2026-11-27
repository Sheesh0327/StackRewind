---
name: author-chapter
description: Interactively interview the user, draft and get approval on a mechanism-first chapter script and storyboard, and then generate the turnkey StackRewind chapter bundle (chapter JSON, codex glossary, looping dual-theme SVG scenes, edge_tts audio, manifest registration, and validation) without touching Read-Only Console code.
---

# Author StackRewind Chapter Bundle

Guide a chapter from initial engineering premise to human-approved script to a complete, validated StackRewind Cartridge deliverable. Never edit Read-Only Console files (`index.html`, `css/`, `js/`).

## Hard Pre-Code Rule (Mandatory Interview & Script Review Gate)

1. **NEVER create or edit any Cartridge file** (`content/<volume>/chapter<N>.json`, `content/<volume>/scenes/*.js`, `content/<volume>/tts/*-tts.json`, `assets/audio/*.mp3`, or `content/manifest.json`) until you have completed **Phase 1 (Discovery Interview)** and received **explicit user approval** in **Phase 2 (Script & Storyboard Review Gate)**.
2. **Explicit Escape Hatch**: Skip Phase 1 and Phase 2 *only* if the user explicitly writes a fast-track instruction such as `"skip review and generate directly"`.

## Canonical Reference

Inspect Volume 1, Chapter 1 as the gold-standard exemplar before drafting:
- Manifest: `content/manifest.json`
- Chapter JSON + inline `tts`: `content/networking/chapter1.json`
- Looping scene helper & scenes: `content/networking/scenes/looping-scene.js` and `content/networking/scenes/net-ch1-p01.js` .. `net-ch1-p06.js`
- Standalone TTS manifest: `content/networking/tts/net-ch1-tts.json`
- Generated audio: `assets/audio/net-ch1-p01.mp3` .. `net-ch1-p06.mp3`

---

## Phase 1 — Discovery Interview

Before drafting full prose or writing any code, ask the user **3–5 concise, focused questions** (using structured multiple-choice options when the host UI supports them, or a clean numbered list otherwise):

1. **Target Scope & Continuity**: Confirm the target `volumeId`, `chapterNumber`, historical `era`, and the causal engineering hook continuing from the previous chapter (or starting the volume).
2. **Core Bottleneck & Concrete Mechanism**: Ask which exact failure mode broke the old system and which concrete mechanisms must be unpacked step-by-step (e.g., frame delimiters, header fields, state tables, queues, lookup algorithms).
3. **Page Budget & Codex Anchors**: Confirm the page count (default `6` pages) and ask which key technical terms (`[[Display Term|term-id]]`) and modern `realWorldSighting` tools/protocols the user wants highlighted.
4. **Visual Metaphors (`svg-scene`)**: Ask if the user has specific diagrams, packet flows, or mechanical animations in mind for any page's looping `960×540` scene.
5. **Voice & Pacing Preference**: Confirm default narration (`en-US-AndrewMultilingualNeural` at default natural speech rate and pitch) unless the user requests a different voice or pacing.

Wait for the user's answers before drafting Phase 2.

---

## Phase 2 — Full Script & Storyboard Review Gate (HARD STOP)

Draft and present the **complete proposed script and visual plan** directly to the user for review:

- **Chapter Header**: `volumeId`, `chapterId` (`ch<N>`), `chapterNumber`, `assetPrefix` (`<vol>-ch<N>`), `era`, `title`, and `subtitle`.
- **Page-by-Page Script (`1..K`)**:
  - `title` and `panelType` (`svg-scene`, plus `sceneModule`: `<assetPrefix>-p<00>`).
  - Full `dialogue` following a **Problem → Concrete Mechanism → Result/Trade-Off** arc (`60–95` target words, strictly `30–130` words after stripping `[[...|...]]` tokens).
  - Exact spoken `tts` string matching `dialogue` cleanly with **zero** `[[` or `]]` brackets.
  - A 1-paragraph `sceneNotes` choreography describing the looping visual states, labels, and contrast cues in both Light and Dark themes.
- **Complete `codex` Glossary**: Every `term-id` referenced in `dialogue`, showing `term`, `shortTag`, `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` (`>= 10` words per prose field).

**STOP HERE.** Do not write or modify any files. End your Phase 2 message with a prompt equivalent to:
> *"Review this script and storyboard (you can also run `fact-check-chapter` on it now). Reply with edits or confirm approval to begin generating files."*

Proceed to Phase 3 only after the user explicitly approves the script (or approves a revised draft).

---

## Phase 3 — Turnkey Build & Validation

Once approved, produce every Cartridge deliverable in a single pass:

### 1. Write `content/<volume>/chapter<N>.json`
- Populate `volumeId`, `chapterId` (`ch<N>`), `chapterNumber`, `assetPrefix` (`<vol>-ch<N>`), `era`, `title`, `subtitle`, `pages[]`, and `codex{}` matching the approved script.
- Verify the **Anti-Bloat Checklist**:
  - Every page follows **Problem → Concrete Mechanism → Result/Trade-Off**.
  - No generic hype ("changed history forever"), no unrelated biographical trivia, and no repeating in `dialogue` what belongs inside `codex`.
  - Every `codex` field (`plainEnglish`, `whyItWasInvented`, `realWorldSighting`) is mechanism-rich and `>= 10` words.

### 2. Author Looping Dual-Theme SVG Scenes (`content/<volume>/scenes/<sceneModule>.js`)
- Follow the `design-svg-scene` skill and import `{ createLoopingScene, ease, lerp, windowPulse }` from `./looping-scene.js`.
- Every `svg-scene` page MUST render a crisp `viewBox="0 0 960 540"` continuously looping `requestAnimationFrame` animation returning seamlessly from `t = duration` to `t = 0`.
- Export all 5 lifecycle hooks: `mount`, `unmount`, `pause`, `resume`, and `replay`.
- Prefix custom `<style>` rules with `[data-scene="<sceneModule>"]` and consume `--sr-*` plus `--scene-teal`, `--scene-crimson`, and `--scene-paper-ink` tokens for both **Warm Paper Noir (Dark)** and **Warm Paper (Light)**.

### 3. Author Standalone TTS Manifest (`content/<volume>/tts/<assetPrefix>-tts.json`)
- Create `content/<volume>/tts/<assetPrefix>-tts.json`:
  ```json
  {
    "volumeId": "<volume>",
    "chapterId": "ch<N>",
    "assetPrefix": "<assetPrefix>",
    "voice": "en-US-AndrewMultilingualNeural",
    "pages": [
      {
        "page": 1,
        "output": "assets/audio/<assetPrefix>-p01.mp3",
        "text": "..."
      }
    ]
  }
  ```
- Keep `text` identical to `page.tts` in `chapter<N>.json` (zero `[[` or `]]` brackets).
- Omit `--rate` and `--pitch` unless explicitly requested by the user so narration stays at natural conversational pacing.

### 4. Synthesize Audio via `edge_tts`
- Run:
  ```sh
  node scripts/generate-tts.mjs --chapter content/<volume>/chapter<N>.json --overwrite
  ```
- If `edge_tts` is unavailable in the environment, run with `--dry-run` to print exact commands and verify structural validity with `--allow-missing-audio`, clearly informing the user which synthesis command remains.

### 5. Register in `content/manifest.json`
- Ensure the parent volume has `"status": "published"` and the chapter entry points to `"dataPath": "content/<volume>/chapter<N>.json"`.

### 6. Validate & QA the Complete Bundle
- Run `node scripts/validate-cartridge.mjs` and fix every error until `[Cartridge Validator] OK` exits `0`.
- Recommended follow-up: run `fact-check-chapter` (if not run during Phase 2) and `review-cartridge` for desktop/mobile Light+Dark browser verification.
