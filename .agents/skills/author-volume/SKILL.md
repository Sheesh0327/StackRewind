---
name: author-volume
description: Interactively plan, approve, and scaffold a new StackRewind computing volume (directory layout, looping-scene helper, manifest registration, and chapter roadmap) before handing chapters off to author-chapter. Never modifies Read-Only Console code.
---

# Author StackRewind Volume

Plan a cohesive multi-chapter computing volume ("Rewind the stack to the problem that created it"), secure user sign-off on the volume roadmap, scaffold the Cartridge directory, and hand off chapters cleanly to `author-chapter`. Never edit Read-Only Console files (`index.html`, `css/`, `js/`).

## Hard Pre-Code & Console Boundary Rules

1. **NEVER create directories or edit `content/manifest.json`** until you have completed **Phase 1 (Volume Design Interview)** and received **explicit user approval** in **Phase 2 (Volume Roadmap Review Gate)** (unless the user explicitly says `"skip review and generate directly"`).
2. **NEVER edit Read-Only Console files** (`index.html`, `css/`, `js/`). All volume state lives strictly under `content/` and `assets/`.

---

## Phase 1 — Volume Design Interview

Before proposing file changes, ask the user **3–5 targeted questions** (as structured multiple-choice questions if supported, or a concise numbered list):

1. **Volume Identity**: Propose or confirm the volume slug (`<volume>`, e.g., `operating-systems`, `databases`, `compilers`), display `title`, `subtitle`, and two-to-four-letter `assetPrefix` code (e.g., `os`, `db`, `cmp`).
2. **Historical Arc & Chapter Count**: Ask how many chapters to plan (typically `3–5`) and which chronological breakpoint starts and ends the volume.
3. **Causal Chain of Crises**: Ask whether the user wants a classic bottleneck-to-solution progression (each chapter's trade-off becomes the next chapter's crisis) or specific historical/system milestones included.
4. **Build Scope**: Ask whether to (a) scaffold the volume + immediately launch `author-chapter` for Chapter 1, or (b) scaffold the volume roadmap and register it as `"coming-soon"` first.

Wait for the user's answers before drafting Phase 2.

---

## Phase 2 — Volume Roadmap Review Gate (HARD STOP)

Present the complete proposed **Volume Roadmap** to the user:

- **Volume Metadata**: `id`, `title`, `subtitle`, initial `status` (`"coming-soon"` until Chapter 1 is authored, or `"published"` once Chapter 1 is built), and `assetPrefix` pattern (`<vol>-ch<N>`).
- **Planned Directory Layout**:
  - `content/<volume>/scenes/looping-scene.js`
  - `content/<volume>/tts/`
  - `content/<volume>/chapter1.json` .. `chapter<K>.json`
- **Ordered Chapter Roadmap Table**:
  - Columns: `Chapter` | `Era` | `Engineering Problem` | `Concrete Mechanism` | `Causal Cliffhanger to Next Chapter` | `dataPath`

**STOP HERE.** Write zero files. Ask the user:
> *"Review this Volume Roadmap. Reply with edits or confirm approval to scaffold `content/<volume>/` and register it in `content/manifest.json`."*

Proceed to Phase 3 only after explicit user confirmation.

---

## Phase 3 — Volume Scaffold & `author-chapter` Handoff

Once approved, scaffold the volume cleanly:

1. **Create Self-Contained Scene Runtime**:
   - Copy `content/networking/scenes/looping-scene.js` into `content/<volume>/scenes/looping-scene.js` so the volume never reaches outside its own directory or touches Console code.
2. **Prepare TTS Folder**:
   - Create `content/<volume>/tts/` (adding a `.gitkeep` only if no chapter TTS manifest is generated in the same session).
3. **Register Volume in `content/manifest.json`**:
   - Add the new volume entry to `volumes[]`.
   - Use `"status": "coming-soon"` if chapters are not yet generated (so `scripts/validate-cartridge.mjs` does not fail on unauthored `"published"` chapters), or `"published"` alongside `"chapters": [...]` if Chapter 1 is built immediately via `author-chapter`.
4. **Validate Baseline Integrity**:
   - Run `node scripts/validate-cartridge.mjs` to verify existing published cartridges still pass (`exit 0`).
5. **Hand Off to `author-chapter`**:
   - If the user chose to build Chapter 1 next, immediately enter `author-chapter` **Phase 1 (Discovery Interview)** for Chapter 1 rather than skipping directly to code generation.
