# Spec Delta

## Purpose

Enforces a mechanism-first, anti-bloat editorial standard across StackRewind chapters and Active Codex entries so readers learn exactly how each engineering solution solved its real-world problem without wading through filler prose.

## ADDED Requirements

### Requirement: Mechanism-First Narrative Arc
Every technical chapter page MUST follow a Problem → Exact Mechanism → Concrete Result/Trade-Off arc explaining *how* the engineering design works rather than merely naming historical events.

#### Scenario: Page explains concrete mechanism instead of summary label
- **GIVEN** a chapter page teaches a protocol, routing algorithm, or hardware primitive
- **WHEN** the page's `dialogue` and `tts` narration are authored
- **THEN** the text states the specific bottleneck, the exact step-by-step mechanism that resolves it, and the concrete outcome or trade-off

### Requirement: Anti-Bloat Page Word Budget
Each page's `dialogue` (after stripping `[[Display|id]]` syntax) and `tts` spoken narration MUST stay concise and scannable, targeting `60–95` words per page and strictly bounded within `30–130` words.

#### Scenario: Page stays within scannable dialogue tray and audio limits
- **GIVEN** a chapter page's `dialogue` and `tts` fields
- **WHEN** evaluated by word count after resolving inline token display labels
- **THEN** the count falls within `30–130` words (targeting `60–95`), avoiding multi-paragraph bloat or tangential trivia

### Requirement: Mechanism-Rich Active Codex Entries
Each chapter `codex` entry MUST offload deeper technical mechanics from the main page tray by supplying concrete, non-stub (`>= 10` words) explanations in `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`.

#### Scenario: Codex entry details operation, historical bottleneck, and modern sighting
- **GIVEN** an inline `[[Display Term|term-id]]` token in a chapter page
- **WHEN** the reader opens that term in the Codex Drawer or Chapter Glossary
- **THEN** `plainEnglish` explains how the mechanism operates step by step, `whyItWasInvented` names the exact failure it resolved, and `realWorldSighting` identifies a concrete modern system where it appears

### Requirement: Automated Content-Density Validation
The cartridge validator MUST verify page word-count bounds (`30–130` words for `dialogue` and `tts`) and minimum `codex` field depth (`>= 10` words per structured field), exiting non-zero when stubs or bloated walls appear.

#### Scenario: Validator rejects under-explained stubs and bloated walls
- **WHEN** `validate-cartridge.mjs` runs against a chapter containing a `< 30`-word stub page, a `> 130`-word bloated page, or a `< 10`-word codex field
- **THEN** the validator reports the exact page or codex field violation and exits with a non-zero status code

### Requirement: Networking Chapter 1 Reference Depth and Audio Sync
`content/networking/chapter1.json` Pages 1–6 and all 9 `codex` entries MUST exemplify the mechanism-first, anti-bloat standard with synced `content/networking/tts/net-ch1-tts.json` and regenerated `assets/audio/net-ch1-p01..06.mp3` voiceovers.

#### Scenario: Networking Chapter 1 explains mechanisms cleanly and plays synced audio
- **WHEN** a reader advances through Pages 1–6 of Networking Chapter 1 and inspects Codex terms (including `[[Hot-Potato Routing|hot-potato-routing]]` on Page 4)
- **THEN** each page explains the exact engineering mechanism in `60–95` words, every Codex entry provides deep mechanism detail, and all 6 regenerated `.mp3` files match the updated `tts` scripts
