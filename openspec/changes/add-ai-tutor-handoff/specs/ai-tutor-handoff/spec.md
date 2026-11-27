# Spec Delta

## Purpose

Lets StackRewind readers ask questions about the current comic page's engineering mechanisms and launch an external AI chat session (defaulting to ChatGPT) preloaded with curated page context on a 100% static site.

## ADDED Requirements

### Requirement: Dialogue-Anchored Tutor Trigger and Slide-Over Drawer Coordination
The reader dialogue tray SHALL expose an `"Ask AI"` trigger paired with the active page that opens a slide-over AI Tutor drawer, coordinates playback and page navigation state while open, and supports standard modal dismissal.

#### Scenario: Opening the AI Tutor drawer pauses active narration and scene motion
- **WHEN** the reader activates the `"Ask AI"` button on a loaded chapter page while audio narration or a looping SVG scene is running
- **THEN** the slide-over AI Tutor drawer opens showing the current chapter and page context, pauses any active audio narration and SVG scene animation, and places focus inside the drawer

#### Scenario: Closing the AI Tutor drawer restores scene playback and protects page navigation
- **GIVEN** the AI Tutor drawer is open and the reader has typed into the question input
- **WHEN** the reader presses `ArrowLeft` or `ArrowRight` while the drawer is open, or closes the drawer via the Close button, `Escape`, or backdrop click
- **THEN** `ArrowLeft` and `ArrowRight` do not flip pages while the drawer is open, and closing the drawer resumes the SVG scene (unless audio was paused for the overlay and remains paused)

### Requirement: Page-Scoped Prompt Assembly and Encoded URL Budget
The system SHALL assemble a mechanism-first tutor prompt scoped to the active page and its referenced codex entries, expose the full prompt for inspection, and guarantee that URL-based handoffs remain within browser-safe encoded URL limits.

#### Scenario: Prompt includes clean page text and only current-page codex terms
- **GIVEN** a page whose dialogue contains `[[Term|term-id]]` tokens alongside additional unused terms in the chapter codex
- **WHEN** the tutor prompt is assembled for a reader question
- **THEN** the prompt includes the volume title, chapter title and era, page number and title, clean bracket-free narration text, optional scene notes, deduplicated codex definitions only for terms referenced on the current page, and the reader's question verbatim

#### Scenario: Long question or rich page context trims URL payload safely without dropping the question
- **GIVEN** a page with multiple long codex definitions and a lengthy reader question that would cause a `?q=` URL to exceed 1,950 encoded characters
- **WHEN** a URL-based handoff (`ChatGPT` or `Claude`) is generated
- **THEN** the system progressively trims optional scene notes, codex definitions, and excerpt length until the final encoded URL is at most 1,950 characters while keeping the reader's question intact, and retains the untrimmed prompt for clipboard copy and preview

#### Scenario: Expandable prompt preview matches current question and page
- **WHEN** the reader opens the prompt preview inside the AI Tutor drawer and edits their question
- **THEN** the preview updates live to show the exact prompt that will be handed off or copied

### Requirement: Multi-Provider Handoff with ChatGPT Default
The system SHALL support **ChatGPT** (default), **Claude**, **Gemini**, and **Copy Prompt** handoffs, persist the reader's chosen provider across sessions, and degrade gracefully when storage, clipboard, or popup permissions are restricted.

#### Scenario: Fresh visit defaults to ChatGPT and persists provider changes
- **GIVEN** no tutor provider preference is stored in browser storage
- **WHEN** the reader opens the AI Tutor drawer, selects a different provider (such as `Claude` or `Gemini`), and later reloads the page
- **THEN** `ChatGPT` is selected initially on the fresh visit, the reader's chosen provider is persisted and restored on reload, and restricted browser storage never throws an uncaught error

#### Scenario: Sending via ChatGPT or Claude opens a prefilled new tab with clipboard backup
- **GIVEN** `ChatGPT` (or `Claude`) is selected and the reader enters a non-empty question
- **WHEN** the reader submits the question via the primary Send button or `Ctrl+Enter` / `Cmd+Enter`
- **THEN** a new tab (`noopener,noreferrer`) opens to `https://chatgpt.com/?q=...` (or `https://claude.ai/new?q=...`) with the URL-budgeted encoded prompt, and the full prompt is copied to the clipboard as a backup

#### Scenario: Sending via Gemini copies prompt and guides one-step paste
- **GIVEN** `Gemini` is selected and the reader enters a non-empty question
- **WHEN** the reader submits the question
- **THEN** the full prompt is copied to the clipboard, the drawer displays clear inline guidance to paste (`Ctrl+V` / `Cmd+V`) into Gemini, and a new tab (`noopener,noreferrer`) opens to `https://gemini.google.com/app` without relying on ignored query parameters

#### Scenario: Copy Prompt copies without opening an external tab
- **WHEN** the reader activates `Copy Prompt` (or submits with `Copy Prompt` selected)
- **THEN** the full prompt is written to the clipboard and inline status feedback confirms the copy without navigating away or opening a new tab

#### Scenario: Popup blocker or clipboard failure falls back gracefully
- **GIVEN** the browser blocks `window.open` or denies `navigator.clipboard.writeText`
- **WHEN** the reader attempts to send or copy a question
- **THEN** the drawer surfaces a non-blocking status message with a direct fallback link (for blocked popups) or selectable prompt text (for failed clipboard writes) without crashing

### Requirement: Contextual Starter Chips and Empty-Submit Guard
The AI Tutor drawer SHALL offer page-relevant starter question chips and prevent submitting blank questions.

#### Scenario: Starter chips adapt to the active page and populate the question input
- **WHEN** the reader opens the AI Tutor drawer on a page that defines one or more codex terms
- **THEN** the drawer presents three concise starter chips referencing the current page's concepts, and clicking any chip fills the question input and moves focus into it

#### Scenario: Blank question submission is blocked with guidance
- **GIVEN** the question input is empty or contains only whitespace
- **WHEN** the reader attempts to submit
- **THEN** no external tab is opened and an inline prompt guides the reader to enter a question or pick a starter chip

### Requirement: Dual-Theme Token Compliance and Responsive Layout
The `"Ask AI"` button and AI Tutor drawer SHALL render cleanly in both Light ("Warm Paper") and Dark ("Warm Paper Noir") themes across desktop (`1280×800`) and mobile (`390×844`) viewports with zero Cartridge changes.

#### Scenario: Light and Dark themes across desktop and mobile viewports
- **WHEN** the reader opens the AI Tutor drawer on desktop (`1280×800`) and mobile (`390×844`) in both Light and Dark themes
- **THEN** all drawer surfaces, provider controls, starter chips, inputs, and buttons inherit `--sr-*` theme tokens with legible contrast, fit within the viewport with zero horizontal overflow, and require zero modifications to `content/` or `assets/`
