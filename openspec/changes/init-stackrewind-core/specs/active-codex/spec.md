# Spec Delta

## Purpose

Transforms inline double-bracket dialogue tokens into interactive highlight controls that auto-pause voiceover narration and open a slide-over Codex Drawer and Chapter Glossary for active historical learning.

## ADDED Requirements

### Requirement: Inline Codex Token Parsing
The system SHALL parse inline tokens formatted as `[[Display Term|term-id]]` in page dialogue into accessible, visually distinct clickable `<button>` elements while preserving surrounding text and escaping raw HTML.

#### Scenario: Dialogue tokens render as accessible highlight buttons
- **GIVEN** a page's dialogue contains `"Dedicated copper lines in [[circuit switching|circuit-switching]] locked capacity."`
- **WHEN** the dialogue tray renders
- **THEN** `circuit switching` renders as a focusable highlight button associated with `circuit-switching` and no raw `[[` or `]]` brackets are visible

#### Scenario: Unmatched token ID degrades safely to plain text
- **GIVEN** dialogue contains `[[unindexed term|unknown-id]]` absent from the chapter's `codex` map
- **WHEN** the dialogue tray renders
- **THEN** `unindexed term` displays cleanly as readable text without throwing an error or opening an empty drawer

### Requirement: Auto-Pause Narration and Structured Codex Drawer
Activating an inline codex button or calling `context.openCodex(termId)` from an SVG scene MUST immediately pause active narration and any active scene's optional `pause()` hook (recording prior playback state) and open the Codex Drawer displaying `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` from the chapter's self-contained `codex`.

#### Scenario: Clicking a highlighted term or scene hotspot pauses playback and opens drawer
- **GIVEN** voiceover narration is actively playing on the current page
- **WHEN** the user activates a highlighted codex term or an SVG scene hotspot invoking `context.openCodex(termId)`
- **THEN** audio narration (and any active scene `pause()` hook) pauses immediately, prior playback state is recorded, and the Codex Drawer slides open displaying `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`

#### Scenario: Clicking a highlighted term when audio is paused or unavailable
- **GIVEN** voiceover audio is paused or in the `"Audio not yet loaded"` state
- **WHEN** the user clicks a highlighted codex term
- **THEN** the Codex Drawer opens displaying all three structured fields without triggering audio errors

### Requirement: Codex Drawer Dismissal and Playback Continuity
Closing the Codex Drawer via `Escape`, the drawer close button, or clicking the backdrop MUST return cleanly to the current comic panel without losing page position, suppressing background arrow-key page turns while open, and allowing the reader to resume paused audio.

#### Scenario: Dismissing drawer restores panel focus and allows audio resume
- **GIVEN** the Codex Drawer is open over Page 1 after auto-pausing narration
- **WHEN** the user presses `Escape`, clicks the close button, or clicks the backdrop overlay
- **THEN** the drawer closes smoothly, Page 1 remains displayed at the paused audio timestamp, and the user can resume playback cleanly

#### Scenario: Open drawer prevents accidental comic page navigation
- **GIVEN** the Codex Drawer is open
- **WHEN** the user presses `ArrowLeft` or `ArrowRight`
- **THEN** the active comic page number does not change

### Requirement: Chapter Glossary Toggle
The system SHALL provide a **Chapter Glossary** control that opens a consolidated view of all codex terms defined in the active chapter and lets the reader inspect each term's three structured fields.

#### Scenario: Opening Chapter Glossary lists all terms in the chapter
- **GIVEN** Chapter 1 is loaded with its codex dictionary
- **WHEN** the user activates the `Chapter Glossary` toggle
- **THEN** active narration pauses if playing and the drawer displays all Chapter 1 terms with access to each term's `plainEnglish`, `whyItWasInvented`, and `realWorldSighting` entries
