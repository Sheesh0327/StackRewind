# Design

## Context

See `proposal.md` for motivation. Both **Antigravity** (see `agy-customizations` discovery rules) and **OpenAI Codex** natively discover `.agents/skills/<name>/SKILL.md` alongside root `AGENTS.md`. Keeping one canonical skill tree under `.agents/skills/` avoids split-brain drift across agent-specific folders.

## Goals / Non-Goals

**Goals:**
- Provide a 5-skill cross-platform authoring suite covering the entire StackRewind content lifecycle:
  1. `author-volume`: Volume roadmap interview → approval gate → `content/<volume>/` + `manifest.json` scaffold → `author-chapter` handoff.
  2. `author-chapter`: Phase 1 Discovery Interview → Phase 2 Full Script & Storyboard Review Gate (hard stop before coding) → Optional `fact-check-chapter` pass → Phase 3 Turnkey Build + `generate-tts.mjs` + `validate-cartridge.mjs`.
  3. `fact-check-chapter`: Technical & historical verification (`VERIFIED` / `IMPRECISE` / `INCORRECT`) across pre-code script drafts or existing chapters.
  4. `design-svg-scene`: Dedicated `960×540` looping dual-theme SVG motion-graphic craft & layout verification.
  5. `review-cartridge`: Pre-publish editorial, TTS pacing, `validate-cartridge.mjs`, and Light/Dark desktop+mobile QA.
- Keep instructions tool-agnostic (avoid hardcoding Antigravity-only or Codex-only tool names where plain behavioral instructions work across both).
- Provide `scripts/validate-skills.mjs` to enforce skill hygiene automatically.

**Non-Goals:**
- Duplicating skills into `.codex/skills/` or `.gemini/` when `.agents/skills/` is already discovered by both platforms.
- Modifying Read-Only Console files (`index.html`, `css/`, `js/`) or rewriting Chapter 1's already-verified content.

## Decisions

### 1. Canonical Cross-Platform Skill Tree (`.agents/skills/` + `AGENTS.md`)
```text
/
├── AGENTS.md                                       # Shared rules + Cross-Platform Skill Directory
├── scripts/
│   ├── generate-tts.mjs
│   ├── validate-cartridge.mjs
│   └── validate-skills.mjs                         # Validates YAML frontmatter + AGENTS.md index
└── .agents/skills/
    ├── author-volume/SKILL.md                      # Volume planning interview + scaffold
    ├── author-chapter/SKILL.md                     # Chapter interview + script review gate + turnkey build
    ├── fact-check-chapter/SKILL.md                 # Historical, mechanism, and SVG accuracy audit
    ├── design-svg-scene/SKILL.md                   # Looping 960x540 dual-theme SVG craft
    └── review-cartridge/SKILL.md                   # End-to-end editorial, TTS & browser QA
```
- **Invocation Parity**: `AGENTS.md` documents how to trigger each skill in Antigravity (`/author-volume`, `/author-chapter`, `/fact-check-chapter`, `/design-svg-scene`, `/review-cartridge`) and Codex (`$author-volume`, `$author-chapter`, etc., or direct natural-language request).

### 2. Hard Pre-Code Interview & Script Review Gate (`author-chapter` & `author-volume`)
- **Phase 1 (Interview)**: Before drafting prose or code, the agent asks 3–5 focused questions (using multiple-choice prompts when available, or concise numbered questions): target chapter/volume metadata, core engineering problem & causal hook from the previous chapter, depth/concepts for `codex`, and preferred visual metaphors/key beats for each `svg-scene`.
- **Phase 2 (Script & Storyboard Review Gate)**: The agent outputs the complete proposed script in chat/artifact—including per-page `title`, `dialogue` (with `[[Term|id]]` tokens, `60–95` words), bracket-free `tts` text, `codex` entries, and 1-paragraph SVG animation choreography—and **STOPS**. It explicitly asks: *"Review this script and storyboard (you can also run `fact-check-chapter` on it now). Reply with edits or approve to begin writing files."*
- **Phase 3 (Turnkey Build)**: Only after explicit user confirmation does the agent write `chapter<N>.json`, `scenes/*.js`, `tts/*-tts.json`, run `generate-tts.mjs`, update `manifest.json`, and run `validate-cartridge.mjs`.

### 3. Fact-Checking Protocol (`fact-check-chapter`)
- Audits 5 dimensions: (1) historical dates, names, and institutions; (2) step-by-step engineering accuracy in `dialogue` and `codex.plainEnglish`; (3) causal accuracy in `whyItWasInvented`; (4) modern accuracy in `realWorldSighting`; and (5) visual-to-prose fidelity between `sceneNotes`/SVG labels and `dialogue`.
- Outputs a concise verdict table (`Claim | Location | Verdict (VERIFIED / IMPRECISE / INCORRECT) | Evidence / Fix`) and waits for user confirmation before patching files (unless the user explicitly requested auto-correction).

### 4. Automated Skill Validator (`scripts/validate-skills.mjs`)
- Pure Node ESM checking:
  - `.agents/skills/` contains expected `SKILL.md` files.
  - Each `SKILL.md` starts with `---` YAML frontmatter containing `name` (matching the parent folder name) and non-empty `description`.
  - Every skill listed under `.agents/skills/` is referenced in `AGENTS.md`.
  - `author-chapter` and `author-volume` explicitly include an approval/review gate before writing files.

## Risks / Trade-offs

- **[Codex vs. Antigravity tool differences]** → Skills describe observable actions ("ask the user", "wait for approval", "search/verify sources if uncertain") rather than naming platform-exclusive tool APIs, ensuring identical behavior in both Antigravity and Codex.
- **[User wants fast generation without interview on rare occasions]** → Skills allow an explicit bypass phrase (e.g., if the user says `"skip review and generate directly"`), while keeping the Interview → Script Review Gate strictly mandatory by default.
