# Tasks

## 1. Interactive Volume & Chapter Skills (Interview + Script Review Gate)

- [x] 1.1 Upgrade `.agents/skills/author-chapter/SKILL.md` to enforce Phase 1 (Discovery Interview on goals, mechanisms, concepts, and visual beats) and Phase 2 (Full Script & Storyboard Review Gate presenting page `dialogue`, `tts`, `codex`, and SVG plan and halting until explicit user approval) before Phase 3 file generation; verify YAML frontmatter and tool-agnostic wording for Antigravity and Codex.
- [x] 1.2 Create `.agents/skills/author-volume/SKILL.md` for planning and scaffolding new volumes (volume/chapter sequence interview, roadmap approval gate, `content/<volume>/` + `looping-scene.js` scaffold, `content/manifest.json` update, and `author-chapter` handoff); verify frontmatter and Console boundary guardrails.

## 2. Fact-Checking, SVG Craft & QA Skills

- [x] 2.1 Create `.agents/skills/fact-check-chapter/SKILL.md` auditing historical dates/names, step-by-step mechanisms, modern `realWorldSighting` accuracy, and SVG-to-dialogue consistency across pre-code drafts or existing chapters, outputting a `VERIFIED` / `IMPRECISE` / `INCORRECT` table before applying fixes; verify frontmatter and checklist completeness.
- [x] 2.2 Create `.agents/skills/design-svg-scene/SKILL.md` (looping `960×540` dual-theme SVG choreography, `--sr-*` + `--scene-*` tokens, zero overlapping labels) and `.agents/skills/review-cartridge/SKILL.md` (pre-publish editorial, TTS pacing, `validate-cartridge.mjs`, and Light/Dark desktop+mobile QA); verify YAML frontmatter and Console boundary rules.

## 3. Cross-Platform Index & Skill Validator

- [x] 3.1 Update `AGENTS.md` with the shared Antigravity + Codex Skill Directory and implement `scripts/validate-skills.mjs` (validating YAML frontmatter `name`/`description`, folder matching, pre-code review gates in `author-chapter`/`author-volume`, and `AGENTS.md` registration); verify `node scripts/validate-skills.mjs`, a negative malformed-skill test, and `node scripts/validate-cartridge.mjs` all report expected exit codes.

## Workflow follow-up

- Archive `add-authoring-skill-suite` once all tasks are applied and verified.
