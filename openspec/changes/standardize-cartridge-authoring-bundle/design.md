# Design

## Context

See `proposal.md` for motivation. Currently, chapter authoring artifacts are split across `data/networking/chapter1.json`, `content/networking/chapter1.json` (still holding an older 2-page dummy fixture), `content/networking/scenes/`, and duplicate `js/scenes/` files, while `assets/audio/net-ch1-p01..06.mp3` exist without a standardized TTS script artifact or generator/validator tooling. Furthermore, `AGENTS.md` and a reusable authoring skill do not yet exist in the repo to guarantee that any generative model automatically emits all deliverables together.

## Goals / Non-Goals

**Goals:**
- Consolidate all writable Cartridge artifacts cleanly under `content/<volume>/` (`chapter<N>.json`, `scenes/`, `tts/`) and return `js/` to 100% Read-Only Console code.
- Standardize the per-page spoken `"tts"` field and `content/<volume>/tts/<assetPrefix>-tts.json` manifest for `edge_tts` (`en-US-AndrewMultilingualNeural`, default natural rate and pitch).
- Provide zero-dependency Node ESM scripts (`scripts/generate-tts.mjs` and `scripts/validate-cartridge.mjs`) to synthesize/preview audio and strictly validate every deliverable in CI or agent workflows.
- Codify the full workflow in `AGENTS.md`, `.agents/skills/author-chapter/SKILL.md`, and `content/README.md`.

**Non-Goals:**
- Modifying Console UI or runtime logic (`index.html`, `css/`, `js/app.js`, `js/audio.js`, `js/codex.js`, `js/parser.js`, `js/theme.js`).
- Rewriting the 6 Chapter 1 looping SVG scenes already implemented in `content/networking/scenes/net-ch1-p01..06.js`.
- Requiring external npm dependencies or Python package installation to run validation or `--dry-run` TTS inspection.

## Decisions

### 1. Canonical Filesystem Consolidation
```text
/
├── AGENTS.md                                      # Repo-wide agent contract (Console vs Cartridge + turnkey deliverables)
├── .agents/skills/author-chapter/SKILL.md         # Reusable step-by-step skill for chapter generation
├── scripts/
│   ├── generate-tts.mjs                           # Synthesizes assets/audio/*.mp3 via python -m edge_tts (or --dry-run)
│   └── validate-cartridge.mjs                     # Validates manifest, JSON, codex, TTS script, SVG exports, audio
├── content/
│   ├── README.md                                  # Updated Cartridge schema & authoring contract
│   ├── manifest.json                              # Points dataPath to content/<vol>/chapter<N>.json
│   └── networking/
│       ├── chapter1.json                          # Migrated from data/ + backfilled with per-page "tts"
│       ├── scenes/
│       │   ├── looping-scene.js
│       │   └── net-ch1-p01.js .. net-ch1-p06.js
│       └── tts/
│           └── net-ch1-tts.json                   # Standalone TTS manifest (voice, rate, pitch, pages[])
└── assets/audio/net-ch1-p01.mp3 .. p06.mp3
```
- **Cleanup**: Delete duplicate `data/`, duplicate `js/scenes/`, and unused `content/networking/scenes/ch1-demo-placeholder.js` after migrating `data/networking/chapter1.json` into `content/networking/chapter1.json` and updating `content/manifest.json`.
- **Rationale**: Eliminates split-brain drift between `data/` and `content/` and restores `js/` as pure immutable Console code.

### 2. TTS Script Schema & `edge_tts` Pipeline
- **Inline per-page `"tts"` field** in `chapter<N>.json`: Expressive spoken narration derived from `dialogue` with all `[[Display Term|term-id]]` brackets stripped (keeping `Display Term`), natural pacing cues (`...`, `—`), and clean pronunciation for acronyms/numbers.
- **Standalone TTS Manifest (`content/<volume>/tts/<assetPrefix>-tts.json`)**:
  ```json
  {
    "volumeId": "networking",
    "chapterId": "ch1",
    "assetPrefix": "net-ch1",
    "voice": "en-US-AndrewMultilingualNeural",
    "pages": [
      {
        "page": 1,
        "output": "assets/audio/net-ch1-p01.mp3",
        "text": "Pull up a chair and listen to that dead line. ..."
      }
    ]
  }
  ```
- **Synthesis Script (`scripts/generate-tts.mjs`)**:
  - Accepts `--chapter <path>` (or defaults to all published chapters in `content/manifest.json`), optional `--page <N>`, `--dry-run`, and `--overwrite`.
  - Auto-detects `edge-tts`, `python`, `py`, or `python3` on `PATH` (using `spawnSync` with argument arrays—zero shell-injection risk even when `--text` contains quotes or punctuation).
  - Runs `edge_tts` with `--voice en-US-AndrewMultilingualNeural` (omitting `--rate` and `--pitch` unless explicitly configured in the TTS JSON) so voiceover plays at natural conversational pace.
  - If `edge_tts` is unavailable locally, exits gracefully with clear instructions and prints the exact ready-to-run `python -m edge_tts --voice en-US-AndrewMultilingualNeural --text "..." --write-media assets/audio/...` commands.
- **Alternatives considered**: Putting TTS text only in a shell script — rejected because structured JSON enables automated validation against `chapter<N>.json` page counts and prevents shell-escaping bugs.

### 3. Automated Validator (`scripts/validate-cartridge.mjs`)
- Runs in pure Node ESM with zero external packages:
  1. Verifies `data/` and `js/scenes/` do not exist and `content/manifest.json` `dataPath` entries stay under `content/`.
  2. Parses every published `chapter<N>.json`, checking required chapter/page fields, `[[Term|id]]` resolution against `chapter.codex`, and presence of non-empty bracket-free `page.tts`.
  3. Verifies matching `content/<vol>/tts/<assetPrefix>-tts.json` exists, sets `voice: "en-US-AndrewMultilingualNeural"`, and matches every page's `output` path and `text`.
  4. Dynamically imports every `"svg-scene"` module (`content/<vol>/scenes/<sceneModule>.js`), verifying all 5 lifecycle exports (`mount`, `unmount`, `pause`, `resume`, `replay`), `[data-scene="<sceneModule>"]` scoping, and `--sr-*` token usage.
  5. Checks `assets/audio/<assetPrefix>-p<00>.mp3` presence (erroring by default or warning under `--allow-missing-audio` during pre-synthesis authoring).

### 4. Agent Discovery (`AGENTS.md` + `.agents/skills/author-chapter/SKILL.md`)
- Root `AGENTS.md` establishes the hard Console vs. Cartridge rules, points directly to `.agents/skills/author-chapter/SKILL.md`, and mandates running `node scripts/validate-cartridge.mjs` before finishing any chapter task.
- `.agents/skills/author-chapter/SKILL.md` provides a deterministic 6-step turnkey checklist so any coding agent automatically outputs `chapter<N>.json`, `codex`, looping SVG scenes (`looping-scene.js` + `--sr-*` dual-theme tokens), `tts/<assetPrefix>-tts.json`, `.mp3` generation via `scripts/generate-tts.mjs`, `manifest.json` registration, and validation.

## Risks / Trade-offs

- **[Local machine lacks Python `edge_tts` package]** → `scripts/generate-tts.mjs` supports `--dry-run` and emits exact copy-pasteable `python -m edge_tts ...` commands; `validate-cartridge.mjs` supports `--allow-missing-audio` when audio must be synthesized in another environment, while defaulting to strict checks so Chapter 1's existing `.mp3`s are verified end-to-end.
- **[Agents bypassing `tts` pacing and copying raw `dialogue`]** → Validator explicitly rejects `[[` or `]]` inside `tts` strings, and `SKILL.md` + Chapter 1 `net-ch1-tts.json` provide concrete pacing examples (`...`, `—`).
