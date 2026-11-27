# Proposal

## Why

Authoring new StackRewind volumes and chapters currently routes through a single build-first `author-chapter` skill that starts writing files immediately—without interviewing the author about the script, pausing for human script review before coding, or fact-checking historical and technical claims. Establishing a shared **Antigravity + Codex authoring skill suite** (discovered natively via `.agents/skills/*/SKILL.md` and `AGENTS.md`) introduces a human-in-the-loop script review gate, dedicated volume scaffolding, rigorous technical/historical fact-checking, looping SVG motion craft, and pre-publish QA.

## What Changes

- **Upgrade `author-chapter` with Mandatory Interview & Script Review Gate**: Update `.agents/skills/author-chapter/SKILL.md` so the agent first interviews the user on chapter goals, mechanisms, and visual beats (Phase 1), then presents the full proposed page-by-page script (`dialogue`, `tts`, `codex`, and SVG animation storyboard) for explicit user sign-off (Phase 2) before writing any JSON, SVG, or `.mp3` files (Phase 3).
- **Add `author-volume` Skill**: Create `.agents/skills/author-volume/SKILL.md` to interview the user on a new computing volume's identity, chapter arc, and causal cliffhangers, pause for roadmap approval, scaffold `content/<volume>/` (including `scenes/looping-scene.js` and `tts/`), register the volume in `content/manifest.json`, and hand off chapter authoring to `author-chapter`.
- **Add `fact-check-chapter` Skill**: Create `.agents/skills/fact-check-chapter/SKILL.md` to audit dates, inventors, institutions, mechanism accuracy (`plainEnglish`), modern `realWorldSighting` claims, and SVG-to-dialogue alignment across either a pre-code script draft or an existing chapter cartridge, reporting `VERIFIED` / `IMPRECISE` / `INCORRECT` verdicts before applying fixes.
- **Add Bonus Craft & QA Skills (`design-svg-scene`, `review-cartridge`)**:
  - `.agents/skills/design-svg-scene/SKILL.md`: Dedicated craft skill for authoring or refining looping `960×540` dual-theme (`--sr-*`) SVG animations with non-overlapping labels and clean `looping-scene.js` lifecycle hooks.
  - `.agents/skills/review-cartridge/SKILL.md`: End-to-end pre-publish QA skill combining `validate-cartridge.mjs`, TTS pacing checks, and Light/Dark desktop (`1280×800`) + mobile (`390×844`) browser verification.
- **Cross-Platform Discovery Index & Skill Validator**: Update `AGENTS.md` with a shared Skill Directory (supporting both Antigravity `/skill-name` and Codex `$skill-name` / prompt invocation) and add `scripts/validate-skills.mjs` to enforce skill frontmatter, folder structure, and `AGENTS.md` registration.

## Capabilities

### New Capabilities
- `agent-authoring-skills`: Cross-platform Antigravity and Codex skill suite covering interactive volume/chapter interviews, mandatory pre-code script review gates, technical/historical fact-checking, looping SVG scene craft, pre-publish QA, and automated skill validation.

### Modified Capabilities
<!-- None — openspec/specs/ is empty and Console runtime behavior remains unchanged -->

## Impact

- **Skills Added/Updated**: `.agents/skills/author-chapter/SKILL.md`, `.agents/skills/author-volume/SKILL.md`, `.agents/skills/fact-check-chapter/SKILL.md`, `.agents/skills/design-svg-scene/SKILL.md`, `.agents/skills/review-cartridge/SKILL.md`.
- **Contract & Tooling**: `AGENTS.md`, `scripts/validate-skills.mjs`.
- **Console & Cartridge Boundary**: Zero edits to `index.html`, `css/`, `js/`, or existing Networking Chapter 1 content/audio/SVG files.
