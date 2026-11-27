# Tasks

## 1. Mechanism-First Editorial Rubric & Validator Bounds

- [x] 1.1 Codify the Mechanism-First & Anti-Bloat standard (Problem → Concrete Mechanism → Result/Trade-Off arc, `60–95` word target per page, `30–130` word hard bounds, `>= 10` word mechanism-focused `codex` entries, and anti-bloat checklist) in `AGENTS.md`, `.agents/skills/author-chapter/SKILL.md`, and `content/README.md`; verify every file documents consistent word targets and rubric rules.
- [x] 1.2 Extend `scripts/validate-cartridge.mjs` with bracket-stripped `countWords()` checks enforcing `30–130` words for `page.dialogue` and `page.tts` and `>= 10` words for each `codex` entry's `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` fields; verify against temp stub (`< 30` words) and bloated (`> 130` words) fixtures that validation fails non-zero.

## 2. Networking Chapter 1 Deepening & Voiceover Sync

- [x] 2.1 Rewrite Pages 1–6 `dialogue` and `tts` (within `60–95` words each, linking `[[Hot-Potato Routing|hot-potato-routing]]` on Page 4) and deepen all 9 `codex` entries in `content/networking/chapter1.json` + sync `content/networking/tts/net-ch1-tts.json`; verify every page explains concrete engineering mechanics and passes `node scripts/validate-cartridge.mjs --allow-missing-audio`.
- [x] 2.2 Regenerate `assets/audio/net-ch1-p01..06.mp3` via `node scripts/generate-tts.mjs --chapter content/networking/chapter1.json --overwrite`, run `node scripts/validate-cartridge.mjs` (exit `0`), and verify desktop (`1280×800`) and mobile (`390×844`) dialogue tray readability, Codex Drawer depth, and audio playback on `http://127.0.0.1:8000/#networking/ch1/1`.

## Workflow follow-up

- Archive `deepen-mechanism-first-content` after implementation and verification pass.
