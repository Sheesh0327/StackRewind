# Proposal

## Why

Free-tier web chat AI accounts shine at different parts of StackRewind authoring—**ChatGPT** for chapter direction, roadmaps, and structured JSON scripts; **Gemini** for historical and engineering fact-checking; and **Claude** for crafting looping dual-theme SVG animations—but free web chats cannot inspect the local repository, emulate `.agents/skills/*`, write Cartridge files, or preview the rendered site. Launching a zero-dependency **Localhost Multi-Model Authoring Studio** (`scripts/author-studio.py`) gives authors a complete local browser GUI to drive that 3-model workflow, paste and save outputs directly into `content/`, synthesize TTS audio, validate Cartridges, and preview the live local StackRewind site before committing.

## What Changes

- **Localhost Multi-Model Authoring Studio (`scripts/author-studio.py`)**: Add a zero-dependency Python 3 (`stdlib` only) localhost server (`127.0.0.1:<port>`, `Cache-Control: no-store`) serving a complete Studio GUI at `/studio` alongside the live local StackRewind reader at `/#<volume>/<chapterId>/1`, opening automatically in the browser with a prominent **Open Live Local Preview** link.
- **3-Stage Free-Model Prompt Generator (with 1-Click Copy & Compact Toggle)**:
  1. **Stage 1 — Free ChatGPT (Direction, Volume Roadmap, Chapter Script & JSON)**: Visual interview form auto-populated from `content/manifest.json` and the previous chapter's final cliffhanger, generating a prompt for either a Volume Roadmap or a complete `chapter<N>.json` + `manifest.json` snippet + `<assetPrefix>-tts.json`.
  2. **Stage 2 — Free Gemini (Fact-Check & Verification)**: Wraps the pasted or saved Chapter JSON / draft in a 5-dimension `/fact-check-chapter` audit prompt (`VERIFIED` / `IMPRECISE` / `INCORRECT`) requesting verified, corrected JSON output.
  3. **Stage 3 — Free Claude (Strictly SVG Animations Only)**: Parses the verified `chapter<N>.json` pages and produces **individual self-contained per-scene Copy buttons (`p01.js`, `p02.js`, …)** for fresh free Claude chats **plus** an optional single **Staged `"NEXT"`** thread prompt—strictly `960×540` dual-theme `looping-scene.js` SVG modules with anti-overlap rules and optional compact exemplar.
- **Paste & Save Workbench + Local Validation + Live Preview**: Paste AI replies directly in the Studio (auto-stripping markdown fences) to save `chapter<N>.json` (auto-syncing `tts/<prefix>-tts.json` and `content/manifest.json`), scaffold new volumes, save individual `scenes/<prefix>-p<00>.js` files under strict `content/` path allowlists, run `node scripts/validate-cartridge.mjs` from the GUI, and click the live preview link to review the local site before committing.
- **Automatic `edge-tts` Default + Optional Google AI Studio Narration**: Saving a verified `chapter<N>.json` automatically synthesizes all `assets/audio/<assetPrefix>-p<00>.mp3` files via `edge-tts` (`en-US-AndrewMultilingualNeural`, default rate/pitch, paced per-page retries) so narration works immediately during local preview. Authors can optionally upgrade any page or full chapter to **Google AI Studio TTS** for higher-quality narration—either via the Gemini `generateContent` audio API (`GEMINI_API_KEY` env var or session-only input, transcoded via `ffmpeg`) or by importing `.wav`/`.mp3` files downloaded from the free Google AI Studio Speech web UI—while preserving `validate-cartridge.mjs` compatibility.
- **Automated Tests & Documentation**: Add `scripts/test_author_studio.py` (`unittest`), add `prompts/` to `.gitignore`, and document the Studio in `AGENTS.md` and `content/README.md`.

## Capabilities

### New Capabilities
- `chat-prompt-authoring-cli`: Zero-dependency Python localhost Authoring Studio GUI and no-cache preview server that orchestrates free-tier ChatGPT (direction/JSON), Gemini (fact-checking), and Claude (strictly SVG animations), saves validated Cartridge files under `content/`, automatically generates `edge-tts` audio (with optional Google AI Studio TTS upgrade), runs validation, and previews the live local site before commit.

### Modified Capabilities
<!-- None — Read-Only Console runtime and existing agent-authoring-skills requirements remain unchanged -->

## Impact

- **New Tooling & Tests**: `scripts/author-studio.py`, `scripts/test_author_studio.py`.
- **Docs & Repo Hygiene**: `.gitignore` (ignore `prompts/`), `AGENTS.md`, `content/README.md`.
- **Console & Cartridge Boundary**: Zero edits to `index.html`, `css/`, `js/`, or any existing `content/` / `assets/` Cartridge files.
