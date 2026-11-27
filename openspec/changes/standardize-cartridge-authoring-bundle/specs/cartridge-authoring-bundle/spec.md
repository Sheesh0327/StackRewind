# Spec Delta

## Purpose

Standardizes StackRewind's single-root cartridge structure, turnkey chapter deliverable bundle (chapter JSON, codex, looping SVG scenes, expressive `edge_tts` scripts, and `.mp3` audio), and automated validation so any generative authoring model delivers complete chapters without Console code changes.

## ADDED Requirements

### Requirement: Canonical Single-Root Cartridge Layout
All chapter definitions, SVG scene modules, and TTS narration scripts MUST reside under `content/<volume>/` (with flat media under `assets/panels/` and `assets/audio/`), eliminating split `data/` or `js/scenes/` cartridge copies.

#### Scenario: Manifest points exclusively to canonical content directory
- **GIVEN** `content/manifest.json` registers published chapters
- **WHEN** the reader or validator resolves a chapter's `dataPath`
- **THEN** `dataPath` resolves inside `content/<volume>/chapter<N>.json` and no duplicate `data/` or `js/scenes/` directories exist

### Requirement: Complete Turnkey Chapter Deliverable Bundle
Authoring or updating any StackRewind chapter MUST produce the complete bundle: manifest registration, self-contained chapter JSON with `[[Term|id]]` dialogue and matching `codex` entries, one continuously looping SVG scene module per `svg-scene` page, and a standalone TTS script plus `.mp3` voiceover assets.

#### Scenario: Chapter authoring delivers every required artifact
- **WHEN** a generative model creates or updates a chapter cartridge (such as Networking Chapter 1)
- **THEN** the workspace includes an updated `content/manifest.json`, `content/<volume>/chapter<N>.json` (with `pages[]`, `codex{}`, and per-page `tts`), `content/<volume>/scenes/<sceneModule>.js` for each `"svg-scene"` page, `content/<volume>/tts/<assetPrefix>-tts.json`, and `assets/audio/<assetPrefix>-p<00>.mp3` targets

### Requirement: Looping Dual-Theme SVG Scene Contract
Every page declared with `"panelType": "svg-scene"` MUST supply an ES6 module exporting `mount`, `unmount`, `pause`, `resume`, and `replay` that renders a continuously looping `960×540` animation using `--sr-*` theme tokens and `[data-scene="<id>"]` CSS scoping.

#### Scenario: Scene module runs continuously and cleans up cleanly
- **GIVEN** a chapter page references `"sceneModule": "net-ch1-p01"`
- **WHEN** the Console mounts, pauses, replays, and unmounts the module across Light and Dark themes
- **THEN** the animation loops seamlessly inside `960×540`, adapts colors via `--sr-*` tokens, pauses/replays on hook invocation, and releases all animation timers on `unmount()`

### Requirement: Expressive edge_tts Script and Audio Synthesis
Each page MUST define a bracket-free spoken `"tts"` string paced for voice delivery and mirrored in `content/<volume>/tts/<assetPrefix>-tts.json`, and the TTS generator MUST invoke `edge_tts` with `en-US-AndrewMultilingualNeural` at default rate and pitch to write `assets/audio/<assetPrefix>-p<00>.mp3`.

#### Scenario: Generating TTS audio strips brackets and applies standardized voice settings
- **GIVEN** a chapter JSON contains `"[[Network Protocol|network-protocol]]"` in `dialogue`
- **WHEN** the TTS script and `generate-tts` tool execute
- **THEN** the `tts` text contains zero `[[` or `]]` brackets, preserves clean spoken punctuation, and runs `edge_tts` with `--voice en-US-AndrewMultilingualNeural` (default rate and pitch) to output `assets/audio/<assetPrefix>-p<00>.mp3`

#### Scenario: Dry-run or missing edge_tts emits runnable synthesis commands
- **GIVEN** `edge_tts` is invoked in `--dry-run` mode or Python `edge_tts` is unavailable locally
- **WHEN** the TTS generator runs for a chapter
- **THEN** it prints exact runnable `python -m edge_tts --voice en-US-AndrewMultilingualNeural ... --write-media assets/audio/<assetPrefix>-p<00>.mp3` commands for every page without corrupting existing `.mp3` files

### Requirement: Automated Cartridge Bundle Validation
The system SHALL provide a CLI cartridge validator that verifies manifest routes, chapter JSON fields, `codex` coverage, bracket-free `tts` strings, standalone TTS manifest parity, SVG scene lifecycle exports, and Console immutability, failing with a non-zero exit code on any error.

#### Scenario: Validating a complete chapter exits zero while missing deliverables fail
- **WHEN** the validator runs against a complete chapter bundle (such as `content/networking/chapter1.json`)
- **THEN** it exits with code `0`; and **WHEN** a `tts` field is missing, contains raw `[[` brackets, references an undefined codex ID, or omits a required scene export, it reports the exact violation and exits non-zero

### Requirement: Repository-Level Agent Contract and Authoring Skill
The repository SHALL include root `AGENTS.md`, a reusable chapter-authoring skill, and `content/README.md` instructing generative models to produce and validate the complete deliverable bundle automatically without modifying Read-Only Console files (`index.html`, `css/`, `js/`).

#### Scenario: Generative model discovers full deliverable checklist automatically
- **WHEN** a coding agent opens the repository to author a new chapter
- **THEN** `AGENTS.md`, the chapter-authoring skill, and `content/README.md` specify every deliverable, `edge_tts` voice setting, looping SVG standard, and validation command in one coherent contract
