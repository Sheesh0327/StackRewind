# Spec Delta

## Purpose

Defines the self-contained chapter Cartridge schema, authors `content/README.md` for future AI cartridge creators, and scaffolds a minimal 2-page dummy fixture (`content/networking/chapter1.json` + `content/networking/scenes/ch1-demo-placeholder.js`) with zero real story or glossary prose.

## ADDED Requirements

### Requirement: Self-Contained Pluggable Chapter Content Schema
`content/networking/chapter1.json` MUST store chapter metadata, an ordered `pages` array (`page`, `panelType`, optional `sceneModule`, `title`, `speaker`, `dialogue`, `sceneNotes`), and a self-contained chapter `codex` map (with `ch<N>-*` scene naming) so parallel agents can author chapters with zero Console edits or shared-file conflicts.

#### Scenario: Swapping story dialogue or scene modules requires zero Console code changes
- **GIVEN** `content/networking/chapter1.json` is loaded by the Console
- **WHEN** a content author replaces dummy dialogue, chapter `codex` entries, or `content/networking/scenes/ch1-*.js` targets with production chapter assets
- **THEN** the Console renders the updated narrative, codex highlights, and SVG scenes with zero edits to `index.html`, `css/`, or `js/`

#### Scenario: Standardized media filenames derive deterministically
- **GIVEN** `chapter1.json` declares `"assetPrefix": "net-ch1"`
- **WHEN** the Console resolves panel image and voiceover URLs for page `N`
- **THEN** image paths map to `assets/panels/net-ch1-p<00>.webp` and audio paths map to `assets/audio/net-ch1-p<00>.mp3`

### Requirement: Two-Page Dummy Fixture Only (No Story Content)
`content/networking/chapter1.json` SHALL contain ONLY a 2-page dummy test fixture with placeholder copy (no real history dialogue or real glossary definitions): Page 1 MUST use `"panelType": "image"` with fallback notes and 2 dummy `[[Term|id]]` tokens, and Page 2 MUST use `"panelType": "svg-scene"` mounting `content/networking/scenes/ch1-demo-placeholder.js`.

#### Scenario: Page 1 verifies image fallback and 2 dummy codex tokens
- **GIVEN** `content/networking/chapter1.json` is loaded with no `.webp` artwork on disk
- **WHEN** Page 1 renders
- **THEN** Page 1 uses `"panelType": "image"`, displays the 16:9 SVG placeholder fallback, and renders 2 clickable dummy `[[Term|id]]` buttons in the dialogue tray

#### Scenario: Page 2 verifies barebones SVG scene module mount and unmount
- **GIVEN** `content/networking/chapter1.json` is loaded
- **WHEN** the user navigates to Page 2 and then navigates back to Page 1
- **THEN** Page 2 uses `"panelType": "svg-scene"` to dynamically import `content/networking/scenes/ch1-demo-placeholder.js`, mounts its placeholder inside `stageEl[data-scene="ch1-demo-placeholder"]`, and cleans up via `unmount()` on exit

### Requirement: Placeholder Codex Entries for Dummy Tokens
Every dummy `[[Display Term|term-id]]` token in `content/networking/chapter1.json` MUST correspond to a placeholder entry in that chapter's `codex` containing non-empty dummy `term`, `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` strings.

#### Scenario: Both dummy tokens resolve to placeholder codex fields
- **GIVEN** the 2 dummy `[[Term|id]]` tokens on Page 1 of `content/networking/chapter1.json`
- **WHEN** each token ID is resolved against `chapter1.json`'s `codex` dictionary
- **THEN** both entries exist and populate placeholder text for `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`

### Requirement: Standalone Cartridge Authoring Specification
`content/README.md` SHALL document the complete Cartridge contract—covering `manifest.json` registration, self-contained `chapter<N>.json` and `codex` schemas, `[[Display Term|term-id]]` syntax, `ch<N>-<scene>.js` progressive hooks (`mount`, `unmount`, `pause`, `resume`, `replay`), `context.openCodex(termId)`, `--sr-*` CSS tokens, `[data-scene]` scoping, and flat `assets/` naming.

#### Scenario: External authoring agent inspects content/README.md
- **GIVEN** an authoring agent opens `content/README.md` without inspecting `js/` or `css/`
- **WHEN** creating a new chapter JSON, SVG scene module, and media files
- **THEN** `content/README.md` specifies every required field, path convention, CSS variable, and lifecycle export needed to pass `[Cartridge Check]` validation
