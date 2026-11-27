# Spec Delta

## Purpose

Defines a zero-dependency Python localhost Authoring Studio (`scripts/author-studio.py`) that provides a complete browser GUI for StackRewind's 3-model free-tier workflow—**ChatGPT** (direction/script/JSON), **Gemini** (fact-checking), and **Claude** (strictly SVG animations)—alongside safe Cartridge paste-and-save endpoints, TTS/validator runners, and a no-cache live local website preview before commit.

## ADDED Requirements

### Requirement: Localhost Authoring Studio GUI and Live Local Site Preview
The Python script SHALL run a zero-dependency local HTTP server (`http.server.ThreadingHTTPServer`) bound strictly to `127.0.0.1` with `Cache-Control: no-store` headers, serving a complete Studio web GUI at `/studio` and the full local StackRewind reader at `/` with a deep-linked Preview link (`/#<volume>/<chapterId>/1`).

#### Scenario: Launching the script starts both the Studio GUI and live site preview
- **WHEN** the user runs `python scripts/author-studio.py`
- **THEN** the server binds `127.0.0.1:<port>` (default `8765`, falling back to an ephemeral free port if busy), opens `http://127.0.0.1:<port>/studio` in the default web browser (unless `--no-open` is passed), serves `/studio` and `/` with `Cache-Control: no-store, no-cache, must-revalidate`, and shuts down cleanly on `Ctrl+C`

#### Scenario: Studio displays a live Preview link to the active chapter
- **WHEN** an author selects or saves a target volume and chapter in the Studio GUI
- **THEN** the Studio renders a direct **Open Live Local Preview** link pointing to `http://127.0.0.1:<port>/#<volume>/<chapterId>/1` so refreshing or opening that tab immediately reflects newly saved JSON, scenes, and audio

### Requirement: Stage 1 (Free ChatGPT) Interview and Continuity Prompt Builder
The Studio SHALL provide a visual discovery interview form (supporting both **New Volume** and **New Chapter** flows) grounded in live repository state (`content/manifest.json` and previous chapter cliffhangers) and SHALL generate a complete prompt tailored for free ChatGPT to produce direction, scripts, and structured JSON.

#### Scenario: Chapter interview auto-populates sequence and previous chapter cliffhanger
- **WHEN** an author chooses an existing volume in Chapter mode
- **THEN** the Studio reads `content/manifest.json`, suggests the next `chapterNumber`, `chapterId` (`ch<N>`), and `assetPrefix` (`<code>-ch<N>`), and injects the final page (`title`, plain-text `dialogue`, `sceneNotes`) of Chapter `N - 1` into the Stage 1 ChatGPT prompt along with StackRewind's `60–95` target word budget (`30–130` validator bounds), `>= 10` words per codex field, and bracket-free `tts` rules

#### Scenario: Volume interview builds a roadmap and manifest prompt
- **WHEN** an author switches Stage 1 to New Volume mode
- **THEN** the form collects volume slug, `2–4` char `code`, title, subtitle, historical arc, chapter count (`3–5`), and progression style, and outputs a ChatGPT prompt requesting the Volume Roadmap table, `content/manifest.json` volume object, and optional Chapter 1 handoff

### Requirement: Stage 2 (Free Gemini) Fact-Check and Deep-Dive Research Prompt Builder
The Studio SHALL generate a self-contained Stage 2 audit and research prompt tailored for free Gemini using the `/fact-check-chapter` 5-dimension verification protocol alongside curated authoritative primary sources and YouTube deep-dive videos before SVG animations are generated.

#### Scenario: Gemini prompt wraps ChatGPT output with structured verdict rules, primary sources, and YouTube links
- **WHEN** the author provides a pasted ChatGPT script/JSON or selects an existing `chapter<N>.json` and clicks Generate Gemini Fact-Check Prompt
- **THEN** the Studio produces a prompt instructing Gemini to verify historical dates/names, step-by-step mechanics, `whyItWasInvented` causality, modern `realWorldSighting` references, and `sceneNotes` consistency (`VERIFIED` / `IMPRECISE` / `INCORRECT`), curate 3–5 verified primary source links plus 2–4 YouTube deep-dive videos under a strict anti-hallucination URL rule, and output the corrected JSON cleanly (including an optional `furtherLearning` array)

### Requirement: Stage 3 (Free Claude) Strictly-SVG Animation Prompt Builder
The Studio SHALL parse a verified `chapter<N>.json` (from disk or pasted input) and generate Stage 3 prompts strictly focused on `960×540` looping dual-theme SVG scene modules for free Claude, offering both per-scene standalone Copy prompts and an optional single staged `"NEXT"` thread prompt.

#### Scenario: Per-scene prompts isolate each SVG module for separate free Claude chats
- **WHEN** the author generates Stage 3 Claude prompts for a chapter with `P` pages
- **THEN** the Studio renders `P` individual self-contained scene prompt cards (`<assetPrefix>-p01.js` through `<assetPrefix>-p<0P>.js`), each containing only that page's `title`, `dialogue`, `sceneNotes`, `looping-scene.js` API contract, `--sr-*` / `--scene-*` theme tokens, `960×540` safe margins (`x: 36..924`, `y: 32..508`), zero-overlap rules, all 5 exports (`mount`, `unmount`, `pause`, `resume`, `replay`), and an optional compact exemplar scene (omitted when `--compact` or the GUI Compact toggle is enabled)

#### Scenario: Optional single staged Claude thread prompt uses NEXT pauses
- **WHEN** the author selects the optional Single Staged `"NEXT"` tab in Stage 3
- **THEN** the Studio produces one combined Claude prompt covering all `P` scenes that instructs Claude to output exactly one `<assetPrefix>-p<00>.js` file per turn and stop to wait for `"NEXT"`

### Requirement: Safe Paste-and-Save Workbench and Console Boundary Enforcement
The Studio SHALL allow authors to paste AI responses directly in the browser GUI to scaffold volumes, save `chapter<N>.json` (auto-syncing `tts/<prefix>-tts.json` and `content/manifest.json`), and save individual `scenes/<prefix>-p<00>.js` modules while strictly forbidding writes outside `content/` or edits to Read-Only Console files (`index.html`, `css/`, `js/`).

#### Scenario: Saving pasted Chapter JSON strips fences and syncs TTS and manifest
- **WHEN** the author pastes valid `chapter<N>.json` output (with or without markdown code fences) and submits Save Chapter
- **THEN** the server strips fences, validates required chapter keys and `pages[]`, writes `content/<volume>/chapter<N>.json`, writes synchronized `content/<volume>/tts/<assetPrefix>-tts.json` (`en-US-AndrewMultilingualNeural`, no `rate`/`pitch`), registers or updates the chapter inside `content/manifest.json`, and returns saved file paths

#### Scenario: Path traversal or Console-path write attempts are rejected
- **WHEN** a save request specifies an invalid volume slug, path traversal (`..`), or a path outside `content/<volume>/` (such as `js/app.js` or `index.html`)
- **THEN** the server rejects the request with HTTP `400` and writes zero files to disk

### Requirement: Automatic Default edge-tts Synthesis and Optional Google AI Studio TTS Upgrade
The Studio SHALL automatically generate `assets/audio/<assetPrefix>-p<00>.mp3` files using `edge-tts` (`en-US-AndrewMultilingualNeural` at default rate and pitch) as the default narration pipeline whenever a chapter is saved or default TTS is run, and SHALL offer an optional Google AI Studio TTS upgrade path (via Gemini REST audio API or free Google AI Studio web audio import) for higher-quality narration.

#### Scenario: Saving a chapter automatically synthesizes default edge-tts audio
- **WHEN** an author saves a verified `chapter<N>.json` with auto-TTS enabled (default `true`) or triggers Default `edge-tts`
- **THEN** the server runs paced per-page `edge-tts` synthesis (`en-US-AndrewMultilingualNeural`, default rate/pitch, up to 3 attempts per page) to write `assets/audio/<assetPrefix>-p<00>.mp3` automatically so audio is immediately playable in the local preview

#### Scenario: Optional Google AI Studio API TTS upgrades narration quality
- **WHEN** the author triggers Google AI Studio TTS with a model (e.g., `gemini-2.5-flash-tts`), prebuilt voice (e.g., `Kore`, `Charon`, `Puck`), optional style instruction, and `GEMINI_API_KEY` (from environment variable or session-only input never written to disk)
- **THEN** the server calls the Gemini `generateContent` endpoint (`responseModalities: ["AUDIO"]`), decodes PCM/WAV audio, transcodes to `assets/audio/<assetPrefix>-p<00>.mp3` via `ffmpeg` (returning a clear HTTP `400` diagnostic if the API key or `ffmpeg` is missing), and keeps `tts/<assetPrefix>-tts.json` valid for `validate-cartridge.mjs`

#### Scenario: Optional free Google AI Studio web audio import converts uploaded files safely
- **WHEN** an author generates speech in the free Google AI Studio web UI without an API key and imports the downloaded `.wav` or `.mp3` for page `P`
- **THEN** the Studio offers per-page Copy Narration buttons and converts/writes the imported audio strictly to `assets/audio/<assetPrefix>-p<00>.mp3` while rejecting any path outside `assets/audio/`

### Requirement: Cartridge Validation and Prompt Export
The Studio SHALL provide GUI actions to run `node scripts/validate-cartridge.mjs` and return live exit codes and logs, and SHALL optionally save generated prompt packs to the gitignored `prompts/` directory.

#### Scenario: Running validation from the Studio returns exact CLI status
- **WHEN** the author triggers Validate Cartridge in the Studio GUI
- **THEN** the server runs `node scripts/validate-cartridge.mjs` and returns the exit code plus `stdout`/`stderr` output to the browser UI
