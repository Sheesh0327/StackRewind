# Proposal

## Why

Current Chapter 1 narration (`~35–45` words per page) introduces historical milestones without explaining the concrete engineering mechanics of *how* each solution actually solved the problem—for example, how hot-potato routing detours locally without a central map, how a FIFO queue absorbs colliding bursts to share one wire, or how packet headers and ARPANET IMPs decoupled host computers from switching. Establishing a **mechanism-first, anti-bloat editorial standard** in our authoring contract, automated validator, and Chapter 1 exemplar ensures every page delivers maximum technical clarity without bloating into textbook walls of prose.

## What Changes

- **Mechanism-First, Anti-Bloat Authoring Rubric**: Update `AGENTS.md`, `.agents/skills/author-chapter/SKILL.md`, and `content/README.md` with explicit writing rules: every page follows a crisp **Problem → Concrete Mechanism → Result/Trade-Off** arc (`60–95` target words per page in `dialogue` and `tts`), offloads deep step-by-step details into rich `codex` entries, and prohibits filler framing or tangential trivia.
- **Automated Content-Density & Anti-Bloat Guardrails**: Extend `scripts/validate-cartridge.mjs` to enforce word-count bounds (`30–130` words per page after stripping `[[Display|id]]` markup, plus `>= 10` words per `codex` field) so generative models consistently hit high-signal technical density without under-explaining or bloating.
- **Deepen Networking Chapter 1 Reference Content**: Rewrite Pages 1–6 `dialogue`, `tts`, and all 9 `codex` entries in `content/networking/chapter1.json` (including linking `[[Hot-Potato Routing|hot-potato-routing]]` on Page 4), sync `content/networking/tts/net-ch1-tts.json`, and regenerate `assets/audio/net-ch1-p01..06.mp3` via `scripts/generate-tts.mjs`.

## Capabilities

### New Capabilities
- `mechanism-first-content-depth`: Editorial depth-without-bloat rubric, word-budget bounds (`60–95` target / `30–130` enforced), deep mechanism-focused Active Codex entries, automated validator density checks, and deepened Networking Chapter 1 narration + audio.

### Modified Capabilities
<!-- None — openspec/specs/ is empty and Read-Only Console behavior remains unchanged -->

## Impact

- **Docs & Skill Updated**: `AGENTS.md`, `.agents/skills/author-chapter/SKILL.md`, `content/README.md`.
- **Tooling Updated**: `scripts/validate-cartridge.mjs`.
- **Chapter 1 Cartridge Updated**: `content/networking/chapter1.json`, `content/networking/tts/net-ch1-tts.json`, `assets/audio/net-ch1-p01.mp3` .. `net-ch1-p06.mp3`.
- **Console Boundary**: Zero edits to `index.html`, `css/`, `js/`, or `content/networking/scenes/*.js`.
