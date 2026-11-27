# Spec Delta

## Purpose

Defines a cross-platform Antigravity and Codex skill suite under `.agents/skills/` and `AGENTS.md` that enforces interactive script interviews, pre-code human script review gates, volume scaffolding, historical/technical fact-checking, looping SVG scene craft, and pre-publish QA.

## ADDED Requirements

### Requirement: Cross-Platform Antigravity and Codex Skill Discovery
All StackRewind authoring skills MUST reside under `.agents/skills/<skill-name>/SKILL.md` with valid YAML frontmatter (`name` matching folder name, non-empty `description`) and tool-agnostic instructions indexed in `AGENTS.md` so both Antigravity and Codex discover and execute them identically.

#### Scenario: Both Antigravity and Codex discover the full skill suite
- **GIVEN** `.agents/skills/*/SKILL.md` and root `AGENTS.md` are checked into the repository
- **WHEN** a user invokes a skill in Antigravity (`/skill-name`) or Codex (`$skill-name` or natural prompt)
- **THEN** the agent loads the matching `SKILL.md` from `.agents/skills/<skill-name>/SKILL.md` with zero duplicated `.codex/` or `.gemini/` workspace copies

### Requirement: Interactive Chapter Interview and Pre-Code Script Review Gate
`author-chapter` MUST conduct an interactive interview and present the complete page-by-page script (`dialogue`, `tts`, `codex`, and SVG animation plan) for explicit user approval before writing or modifying any chapter JSON, SVG scene, TTS manifest, `.mp3`, or `manifest.json` file.

#### Scenario: Authoring a chapter pauses for interview and script sign-off before coding
- **GIVEN** a user invokes `author-chapter` to create or rewrite a chapter
- **WHEN** the agent starts the workflow
- **THEN** it asks targeted discovery questions first, presents the complete Problem → Mechanism → Result script and storyboard for user review, and writes zero Cartridge files until the user approves the script

### Requirement: Interactive Volume Planning and Scaffolding Skill
`author-volume` MUST interview the user about a new computing volume's identity, chapter sequence, and causal cliffhangers, pause for roadmap approval, and then scaffold `content/<volume>/` (including `scenes/looping-scene.js` and `tts/`) and register the volume in `content/manifest.json` without editing Console code.

#### Scenario: Scaffolding a new volume preserves Console boundary
- **WHEN** the user approves the volume roadmap produced by `author-volume`
- **THEN** the agent creates `content/<volume>/scenes/looping-scene.js` and `content/<volume>/tts/`, registers the volume in `content/manifest.json`, hands off each chapter to `author-chapter`, and leaves `index.html`, `css/`, and `js/` untouched

### Requirement: Historical and Technical Fact-Checking Skill
`fact-check-chapter` MUST verify historical dates, people, institutions, step-by-step technical mechanics, modern `realWorldSighting` claims, and SVG-to-dialogue consistency across either a pre-code script draft or an existing chapter JSON, outputting a structured `VERIFIED` / `IMPRECISE` / `INCORRECT` audit before applying fixes.

#### Scenario: Fact-checking reports verifiable verdicts before editing
- **WHEN** `fact-check-chapter` runs against a draft script or `content/<volume>/chapter<N>.json`
- **THEN** it checks every factual claim and SVG diagram detail, reports each item as `VERIFIED`, `IMPRECISE`, or `INCORRECT` with exact proposed corrections, and waits for approval (unless auto-fix was requested) before editing files

### Requirement: Specialized SVG Craft and Pre-Publish QA Skills
`design-svg-scene` MUST govern creating or polishing looping `960×540` dual-theme (`--sr-*`) SVG animations, and `review-cartridge` MUST run automated validation, mechanism/anti-bloat checks, TTS pacing checks, and Light/Dark desktop+mobile QA before publishing.

#### Scenario: Dedicated SVG and QA skills verify visual and runtime quality
- **WHEN** a user invokes `design-svg-scene` or `review-cartridge`
- **THEN** `design-svg-scene` produces a `looping-scene.js`-based `960×540` animation with non-overlapping Light/Dark labels, and `review-cartridge` runs `validate-cartridge.mjs` plus desktop (`1280×800`) and mobile (`390×844`) browser checks

### Requirement: Automated Skill Suite Validation
`scripts/validate-skills.mjs` MUST verify that every directory under `.agents/skills/` contains a valid `SKILL.md` with matching YAML `name`, non-empty `description`, required workflow sections, and an entry in `AGENTS.md`, exiting non-zero on any mismatch.

#### Scenario: Skill validator catches missing frontmatter or unregistered skills
- **WHEN** `node scripts/validate-skills.mjs` runs against a valid skill suite
- **THEN** it exits `0`; and **WHEN** a skill omits YAML `name`/`description`, mismatches its folder name, or is missing from `AGENTS.md`, it exits non-zero
