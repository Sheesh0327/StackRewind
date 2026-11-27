# Tasks

## 1. Canonical Cartridge Consolidation & Chapter 1 TTS Backfill

- [x] 1.1 Migrate `data/networking/chapter1.json` into `content/networking/chapter1.json`, update `content/manifest.json` (`dataPath: "content/networking/chapter1.json"`), and remove duplicate `data/`, `js/scenes/`, and unused `content/networking/scenes/ch1-demo-placeholder.js`; verify `content/manifest.json` parses cleanly and points solely under `content/`.
- [x] 1.2 Backfill clean bracket-free `tts` scripts for Pages 1–6 in `content/networking/chapter1.json` and create `content/networking/tts/net-ch1-tts.json` (`voice: "en-US-AndrewMultilingualNeural"`, deterministic `assets/audio/net-ch1-p<00>.mp3` targets); verify JSON validity and zero `[[` or `]]` tokens inside `tts` strings.

## 2. TTS Generator & Cartridge Bundle Validator (`scripts/`)

- [x] 2.1 Implement `scripts/generate-tts.mjs` supporting `--chapter`, `--page`, `--dry-run`, and `--overwrite` to invoke `edge_tts` (`en-US-AndrewMultilingualNeural` at default rate and pitch) per page (or emit exact runnable commands if Python/`edge_tts` is unavailable); verify `node scripts/generate-tts.mjs --chapter content/networking/chapter1.json --dry-run` prints all 6 exact commands and exits `0`.
- [x] 2.2 Implement `scripts/validate-cartridge.mjs` to check single-root layout (no `data/` or `js/scenes/`), manifest resolution, chapter schema & codex resolution, bracket-free `tts` parity with `<assetPrefix>-tts.json`, SVG scene module 5 lifecycle exports (`mount`, `unmount`, `pause`, `resume`, `replay`), `[data-scene]` scoping, `--sr-*` token usage, and `.mp3` assets (with `--allow-missing-audio` option); verify `node scripts/validate-cartridge.mjs` exits `0` on Chapter 1 and fails non-zero when tested against an intentionally invalid fixture in memory/temp.

## 3. Agent Contract, Authoring Skill & End-to-End Audit

- [x] 3.1 Author root `AGENTS.md`, reusable `.agents/skills/author-chapter/SKILL.md`, and updated `content/README.md` codifying the turnkey chapter bundle (JSON + codex + looping `--sr-*` SVG animations via `looping-scene.js` + expressive `edge_tts` scripts/audio + `manifest.json` registration + validator gate); verify all documented file paths and CLI commands match the workspace accurately.
- [x] 3.2 Run final validation (`node scripts/validate-cartridge.mjs` and `node scripts/generate-tts.mjs --dry-run`) and live browser check on `http://127.0.0.1:8000/#networking/ch1/1` across Pages 1–6 confirming looping SVG animations, audio playback, and zero console errors.

## Workflow follow-up

- Archive `standardize-cartridge-authoring-bundle` once all tasks are applied and verified.
