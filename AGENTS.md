# StackRewind — Repository Agent Contract

**StackRewind** (*"Rewind the stack to the problem that created it."*) is a zero-build static web reader built with a strict **Console vs. Cartridge** architecture.

## 1. Hard Console vs. Cartridge Boundary

- **Read-Only Console (DO NOT EDIT when authoring content):** `index.html`, `css/`, `js/`
- **Writable Content Cartridges:** `content/` and `assets/`
- **Authoring Tooling:** `scripts/author-studio.py`, `scripts/generate-tts.mjs`, `scripts/validate-cartridge.mjs`, `scripts/validate-skills.mjs`

Adding or updating a volume or chapter MUST NEVER require modifying `index.html`, `css/`, or `js/`.

## 2. Mandatory Turnkey Chapter Deliverable Bundle

Whenever a coding agent or generative model is asked to write, update, or generate a StackRewind chapter, it MUST automatically produce **all** of the following deliverables together in one pass:

1. **Manifest Registration** (`content/manifest.json`)
   - Register or update the volume/chapter entry with `"dataPath": "content/<volume>/chapter<N>.json"`.
2. **Self-Contained Chapter JSON** (`content/<volume>/chapter<N>.json`)
   - `volumeId`, `chapterId`, `chapterNumber`, `assetPrefix` (`<vol>-ch<N>`), `era`, `title`, `subtitle`, `pages[]`, and chapter-scoped `codex{}`.
   - Every page's `dialogue` uses `[[Display Term|term-id]]` inline tokens resolved in `chapter.codex`.
   - Every page MUST include a clean, bracket-free `"tts"` spoken narration string (no `[[` or `]]`).
   - Every page MUST include a verified `"deepDive"` object (`title`, `channel`, `url`, `focus`) pointing to a real YouTube deep-dive video for that page's core concept (never guess or fabricate YouTube video IDs).
3. **Looping Dual-Theme SVG Scene Modules** (`content/<volume>/scenes/<sceneModule>.js`)
   - Every `"panelType": "svg-scene"` page MUST ship a continuously looping `960×540` SVG animation built on `content/networking/scenes/looping-scene.js` (or matching contract), exporting `mount`, `unmount`, `pause`, `resume`, and `replay`.
   - Must scope CSS with `[data-scene="<id>"]` and consume `--sr-*` theme tokens so both Warm Paper Noir (Dark) and Warm Paper (Light) themes work automatically.
4. **Standalone TTS Manifest & Synthesized Audio** (`content/<volume>/tts/<assetPrefix>-tts.json` + `assets/audio/<assetPrefix>-p<00>.mp3`)
   - Standardized voice profile: `en-US-AndrewMultilingualNeural` at default natural speech rate and pitch (omit `--rate` and `--pitch`).
   - Generate `.mp3` voiceovers via `node scripts/generate-tts.mjs --chapter content/<volume>/chapter<N>.json --overwrite`.
5. **Automated Validation Gate**
   - Always run `node scripts/validate-cartridge.mjs` before finishing and ensure exit code `0`.

## 3. Mechanism-First & Anti-Bloat Editorial Standard

- Every chapter page MUST follow a **Problem → Concrete Mechanism → Result/Trade-Off** arc explaining *how* the solution works (bits, headers, buffers, relays, routing rules), never vague historical hype.
- Keep `dialogue` and `tts` dense and scannable: **`60–95` target words per page** (`30–130` enforced by `validate-cartridge.mjs`), offloading multi-step technical depth into `codex` entries (`>= 10` words per `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` field).

## 4. Cross-Platform Skill Directory (Antigravity & Codex)

All authoring skills live canonically in `.agents/skills/<skill-name>/SKILL.md` so both **Antigravity** (`/skill-name`) and **OpenAI Codex** (`$skill-name` or natural-language request) discover and execute the exact same workflow with zero duplicate `.codex/` or `.gemini/` workspace copies.

| Skill | Antigravity / Codex Invocation | When to Use |
| :--- | :--- | :--- |
| [`author-volume`](.agents/skills/author-volume/SKILL.md) | `/author-volume` / `$author-volume` | Interview, approve roadmap, and scaffold a new volume (`content/<volume>/` + `manifest.json`) before authoring chapters |
| [`author-chapter`](.agents/skills/author-chapter/SKILL.md) | `/author-chapter` / `$author-chapter` | Run Discovery Interview + Script & Storyboard Review Gate before writing any chapter JSON, SVG scene, TTS manifest, or `.mp3` |
| [`fact-check-chapter`](.agents/skills/fact-check-chapter/SKILL.md) | `/fact-check-chapter` / `$fact-check-chapter` | Verify historical dates, engineering mechanics, `realWorldSighting` claims, and SVG-to-dialogue accuracy (`VERIFIED` / `IMPRECISE` / `INCORRECT`) |
| [`design-svg-scene`](.agents/skills/design-svg-scene/SKILL.md) | `/design-svg-scene` / `$design-svg-scene` | Design or refine looping `960×540` dual-theme `--sr-*` SVG animations built on `looping-scene.js` |
| [`review-cartridge`](.agents/skills/review-cartridge/SKILL.md) | `/review-cartridge` / `$review-cartridge` | Run pre-publish validation (`validate-cartridge.mjs`), TTS pacing checks, and Light/Dark desktop+mobile QA |

> **Pre-Code Review Gate:** `author-volume` and `author-chapter` MUST ask targeted interview questions and obtain explicit user approval on the roadmap or full script/storyboard before writing Cartridge files (unless the user explicitly says `"skip review and generate directly"`).
> **Volume Roadmap Source of Truth:** Whenever `content/<volume>/ROADMAP.md` exists (e.g., [`content/networking/ROADMAP.md`](content/networking/ROADMAP.md)), every authoring agent MUST read it alongside `content/manifest.json`, select the lowest unpublished chapter number by default, and follow its chapter brief, storyboard beats, design rationale, reader puzzle, and cited evidence.

Validate all skills with `node scripts/validate-skills.mjs`, and inspect [`content/README.md`](content/README.md) whenever authoring or modifying chapters.
