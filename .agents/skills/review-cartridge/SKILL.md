---
name: review-cartridge
description: Run end-to-end pre-publish StackRewind QA on a chapter or volume including validate-cartridge checks, TTS dry-run and voice pacing review, mechanism-first anti-bloat word counts, and Light/Dark desktop plus mobile browser verification.
---

# Review StackRewind Cartridge (Pre-Publish QA)

Perform comprehensive technical, editorial, audio, and visual QA on a chapter or volume before considering it ready to publish. Never edit Read-Only Console files (`index.html`, `css/`, `js/`).

## 1. Automated Structural & Asset Checks

Run the repository validators from the workspace root:

1. `node scripts/validate-cartridge.mjs` — MUST pass with `[Cartridge Validator] OK` and exit `0`.
2. `node scripts/generate-tts.mjs --chapter content/<volume>/chapter<N>.json --dry-run` — verify voice (`en-US-AndrewMultilingualNeural`), default speech rate/pitch (no unrequested `--rate` or `--pitch`), and matching `assets/audio/<assetPrefix>-p<00>.mp3` paths.
3. `node scripts/validate-skills.mjs` — run if any skill under `.agents/skills/` or `AGENTS.md` was also touched.
4. Confirm every `assets/audio/<assetPrefix>-p<00>.mp3` file exists and is non-empty.

## 2. Editorial & Mechanism-First Audit

Inspect `content/<volume>/chapter<N>.json` and `content/<volume>/tts/<assetPrefix>-tts.json`:

- **Arc Check**: Confirm every page follows **Problem → Concrete Mechanism → Result/Trade-Off** with specific engineering mechanics (headers, frames, queues, latches, routing rules) rather than generic hype.
- **Word-Count Pacing**: Check clean spoken word counts (stripping `[[...|...]]`): target **`60–95` words per page** (validator hard bounds `30–130`). Flag pages that feel rushed (`< 50`) or bloated (`> 100`).
- **TTS Parity & Cleanliness**: Verify `page.tts` matches `page.dialogue` cleanly with zero `[[` or `]]` tokens, natural spoken punctuation, and identical `text` inside `<assetPrefix>-tts.json`.
- **Codex Depth**: Confirm every `term-id` used in `dialogue` exists in `codex` and every `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` field has `>= 10` concrete, non-filler words.

## 3. Cross-Theme & Responsive Browser QA

Serve the static app over HTTP (never `file://`) and inspect **every page** of the target chapter across:
- **Themes**: Both **Warm Paper Noir (Dark)** and **Warm Paper (Light)**.
- **Viewports**: Desktop (`1280×800`) and mobile (`390×844`).

Verify on every page:
1. **Zero Console/Network Errors**: No 404s (JSON, `.js` scene modules, `.mp3`), no runtime JS exceptions.
2. **Looping SVG Motion**: Animations run continuously (`requestAnimationFrame`), visibly change across frames, and loop seamlessly without snapping awkwardly.
3. **Theme Contrast & Layout**: Crisp legibility in both Dark and Light modes, zero clipped text at SVG/stage borders, and zero overlapping labels or controls.
4. **Interactive Controls**:
   - Clicking `[[Term|id]]` Codex pills opens the Codex drawer with complete fields.
   - Next/Previous navigation updates page number, SVG scene, `Deep-Dive Video` card, and audio track cleanly.
   - Audio playback initializes without decoding errors.
   - Each page's `Deep-Dive Video` card renders cleanly in Light and Dark themes without text overlap or overflow and links to a valid `https://` YouTube URL.

## 4. Pre-Publish QA Verdict Report

Summarize findings clearly:
- **Checks Run & Exit Codes**: List exact validator commands and pass/fail status.
- **Blocking Issues**: Missing assets, validation failures, broken themes, clipped SVG text, or console errors (must fix before publishing).
- **Non-Blocking Polish Suggestions**: Optional wording, pacing, or visual refinements.
- **Publish Readiness**: `PASS` or `FAIL (fix blocking items first)`.
