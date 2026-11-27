# Tasks

## 1. Repo Hygiene, Loopback Server & Read-Only State API

- [x] 1.1 Add `prompts/` to `.gitignore` and verify `git status --short` ignores sample files under `prompts/`.
- [x] 1.2 Create `scripts/author-studio.py` with CLI flags (`--port`, `--no-open`, `--compact`, `--exemplar`), `ThreadingHTTPServer` bound strictly to `127.0.0.1` with free-port fallback and `Cache-Control: no-store` headers serving `/` and `/studio`, plus `GET /api/state` reading `content/manifest.json`, chapter file statuses, and previous chapter cliffhangers; verify `python scripts/author-studio.py --help` exits `0`.

## 2. Multi-Model Prompt Builders (ChatGPT, Gemini, Claude)

- [x] 2.1 Implement Stage 1 (`POST /api/prompts/chatgpt` for New Volume & New Chapter interviews with live cliffhanger injection and `60–95` word / `>= 10` codex-word guardrails) and Stage 2 (`POST /api/prompts/gemini` 5-dimension `VERIFIED`/`IMPRECISE`/`INCORRECT` fact-check prompt builder) with optional export to `prompts/`.
- [x] 2.2 Implement Stage 3 (`POST /api/prompts/claude`) parsing verified `chapter<N>.json` pages to emit per-scene standalone Copy prompts (`p01.js..p0K.js`) plus an optional single staged `"NEXT"` thread prompt, honoring `compact` mode and embedding `looping-scene.js`, `--sr-*` tokens, `960×540` safe margins, and anti-overlap rules; add unit tests in `scripts/test_author_studio.py` covering Stages 1, 2, 3, and `--compact`, and verify `python -m unittest discover -s scripts -p "test_*.py"` passes.

## 3. Safe Paste-and-Save, Automatic edge-tts, Optional Google AI Studio TTS & Validator APIs

- [x] 3.1 Implement `POST /api/save/volume`, `POST /api/save/chapter` (fences stripping, schema check, auto `tts/<prefix>-tts.json` generation, `content/manifest.json` sync, and optional `autoTts: true` automatic `edge-tts` trigger), and `POST /api/save/scene` (fences stripping, `createLoopingScene`/`--sr-` check, strict `content/` allowlist rejecting path traversal or Console paths); add temp-directory unit tests verifying valid saves and HTTP `400` path-escape rejections.
- [x] 3.2 Implement `POST /api/run/tts` supporting paced per-page default `edge-tts` synthesis (`node scripts/generate-tts.mjs`) plus optional `google-ai-studio` REST TTS (`urllib.request` `generateContent` `responseModalities: ["AUDIO"]`, PCM/WAV → `.mp3` via `ffmpeg`), `POST /api/save/audio` (for free Google AI Studio web `.wav`/`.mp3` import strictly under `assets/audio/`), and `POST /api/run/validate` (`node scripts/validate-cartridge.mjs`); add unit tests mocking the Gemini TTS HTTP response and testing PCM-to-WAV-to-MP3 conversion, missing API key errors, and `assets/audio/` path allowlist enforcement.

## 4. Complete Localhost Studio Web GUI (`/studio`) & Live Preview

- [x] 4.1 Build the self-contained `/studio` HTML/CSS/JS workbench inside `scripts/author-studio.py` featuring the Volume/Chapter selector, prominent **Open Live Local Preview (`/#<vol>/<ch>/1`)** button, Stage 1 ChatGPT interview form & save box (`autoTts` default on), Stage 2 Gemini fact-check tab, Stage 3 Claude per-scene Copy/Paste cards (`p01.js..p0K.js`) + Single Staged `"NEXT"` tab + Compact toggle, and Stage 4 Narration panel (default `edge-tts` status + optional Google AI Studio API controls & free web `.wav`/`.mp3` import) + Validator console output; add HTTP integration tests in `scripts/test_author_studio.py` checking `GET /`, `GET /studio`, `Cache-Control: no-store`, `/api/state`, and `/api/prompts/*` returning HTTP `200`.

## 5. Documentation & Final Integration Verification

- [x] 5.1 Document `python scripts/author-studio.py` (`--port`, `--no-open`, `--compact`) under Authoring Tooling in `AGENTS.md` and `content/README.md`, then run `python -m unittest discover -s scripts -p "test_*.py"`, `node scripts/validate-cartridge.mjs`, and `node scripts/validate-skills.mjs` and confirm all exit `0` with `index.html`, `css/`, and `js/` untouched.
