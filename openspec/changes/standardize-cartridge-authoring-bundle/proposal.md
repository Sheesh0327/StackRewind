# Proposal

## Why

Authoring a StackRewind chapter currently relies on manual prompts and split paths (`data/networking/chapter1.json` vs `content/networking/chapter1.json`, plus duplicate `js/scenes/` files), causing generative models to deliver partial outputs—dialogue without expressive TTS scripts, static diagrams instead of looping SVG animations, or missing `.mp3` voiceovers. Formalizing a turnkey **Cartridge Authoring Bundle** contract, reusable chapter-authoring skill, consolidated `content/<volume>/` layout, `edge_tts` pipeline, and automated validator guarantees every authored chapter ships complete, consistent deliverables in a single pass.

## What Changes

- **Consolidate Canonical Cartridge Layout Under `content/<volume>/`**: Unify `chapter<N>.json`, `scenes/`, and `tts/` under `content/<volume>/` (migrating `data/networking/chapter1.json` to `content/networking/chapter1.json`, updating `content/manifest.json` `dataPath`, and removing duplicate `data/` and `js/scenes/` directories plus obsolete `ch1-demo-placeholder.js`).
- **Turnkey Chapter Bundle & Expressive `edge_tts` Narration Contract**: Require every chapter to deliver (1) `content/manifest.json` entry, (2) `content/<volume>/chapter<N>.json` with `[[Display Term|term-id]]` dialogue, matching `codex` entries, and an expressive bracket-free `"tts"` spoken script per page, (3) one continuously looping `960×540` SVG scene module per `svg-scene` page using `--sr-*` theme tokens and `looping-scene.js`, and (4) `content/<volume>/tts/<assetPrefix>-tts.json` paired with `edge_tts` synthesis (`en-US-AndrewMultilingualNeural` at default natural rate and pitch) into `assets/audio/<assetPrefix>-p<00>.mp3`.
- **Automated TTS Generator & Bundle Validator Scripts**: Add `scripts/generate-tts.mjs` (invoking `edge_tts` per page or printing exact commands in `--dry-run`/fallback mode) and `scripts/validate-cartridge.mjs` (verifying manifest links, chapter JSON schema, codex resolution, bracket-free `tts`, looping scene module 5 exports, `[data-scene]` scoping, Console cleanliness, and `.mp3` assets).
- **Repo-Level Agent Contract & Authoring Skill**: Add root `AGENTS.md`, `.agents/skills/author-chapter/SKILL.md`, and updated `content/README.md` so any generative coding model automatically produces and validates the entire bundle without touching Read-Only Console files (`index.html`, `css/`, `js/`).

## Capabilities

### New Capabilities
- `cartridge-authoring-bundle`: Single-root `content/<volume>/` cartridge structure, mandatory turnkey chapter deliverable bundle (JSON, codex, looping SVG scenes, expressive `edge_tts` script + audio), automated bundle validation, and repo-level agent skill instructions.

### Modified Capabilities
<!-- None — openspec/specs/ is empty and Console reader requirements remain unchanged -->

## Impact

- **Files Added/Updated**: `AGENTS.md`, `.agents/skills/author-chapter/SKILL.md`, `content/README.md`, `content/manifest.json`, `content/networking/chapter1.json`, `content/networking/tts/net-ch1-tts.json`, `scripts/generate-tts.mjs`, `scripts/validate-cartridge.mjs`.
- **Workspace Cleanup**: Removal of duplicate `data/`, `js/scenes/`, and unused `content/networking/scenes/ch1-demo-placeholder.js`.
- **Console Boundary**: Zero edits to `index.html`, `css/`, or `js/*.js` runtime code; zero npm dependencies added (pure Node ESM + optional `python -m edge_tts`).
