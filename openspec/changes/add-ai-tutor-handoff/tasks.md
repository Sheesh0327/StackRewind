# Tasks

## 1. Dialogue Trigger, Tutor Drawer Markup & Dual-Theme Styling (`index.html`, `css/main.css`, `css/tutor.css`)

- [x] 1.1 Add the `#ask-tutor-btn` trigger button inside `.sr-dialogue-header` and the `<dialog id="tutor-drawer" class="sr-codex-drawer sr-tutor-drawer" closedby="any" aria-labelledby="tutor-title">` markup in `index.html` (context summary pill, 3-chip starter strip, question `<textarea>`, provider selector defaulting to ChatGPT alongside Claude, Gemini, and Copy Prompt, collapsible `<details>` prompt preview, `aria-live="polite"` status region, and submit/copy controls), linking `./css/tutor.css`; verify in a local static server that the drawer renders in the DOM without breaking `.sr-dialogue-header` alignment or producing console errors.
- [x] 1.2 Author `css/tutor.css` and minor `.sr-dialogue-header` layout rules in `css/main.css` using `--sr-*` CSS custom properties exclusively so the `"Ask AI"` button, starter chips, provider segmented controls, textarea, prompt preview, and fallback notices maintain WCAG AA legibility in both Warm Paper (Light) and Warm Paper Noir (Dark) themes and fit desktop (`1280×800`) and mobile (`390×844`) viewports with zero horizontal overflow.

## 2. Prompt Builder & Provider Handoff Controller (`js/tutor.js`)

- [x] 2.1 Implement `createTutorController` in `js/tutor.js` mirroring `js/codex.js` slide-over `<dialog>` lifecycle (`allow-discrete` + `[data-closing]` exit fallback, `closedby="any"` + backdrop fallback, `onBeforeOpen` / `onAfterClose`), `localStorage` persistence (`"sr-tutor-provider"`, defaulting to `"chatgpt"` with `try/catch` degradation), 3 contextual starter chips derived from the active page's codex terms, empty-input validation, and `Ctrl+Enter` / `Cmd+Enter` submit handling; verify all provider switches, chip clicks, and empty-submit guards work interactively in the browser.
- [x] 2.2 Implement page-scoped prompt assembly and URL-budgeting in `js/tutor.js`: extract clean narration (`page.tts` or bracket-stripped `page.dialogue`), `page.sceneNotes`, and deduplicated active-page codex entries via `extractTermIds(page.dialogue)`, update the `<details>` prompt preview live on input/context change, enforce `<= 1950` encoded URL characters via deterministic progressive trimming (`sceneNotes` -> codex entries -> excerpt truncation) while preserving the reader's question, execute `window.open(..., "_blank", "noopener,noreferrer")` synchronously in the click/submit gesture before/alongside `navigator.clipboard.writeText(...)` (so popup blockers do not fire), treat Gemini as copy-and-open (`https://gemini.google.com/app` + inline paste guidance), and render popup-blocked fallback links / selectable preview fallback on clipboard errors; verify generated ChatGPT/Claude URLs stay `<= 1950` chars even with long inputs.

## 3. Reader Integration (`js/app.js`)

- [x] 3.1 Wire `createTutorController` into `js/app.js`: open `#tutor-drawer` from `#ask-tutor-btn`, sync `tutor.setContext({ volume: state.volume, chapter: state.chapter, page, pageIndex: state.pageIndex })` inside `renderPage()`, coordinate audio narration pause/resume and `state.activeScene` pause/resume across both Codex and Tutor overlays, and extend the `keydown` guard so `ArrowLeft`/`ArrowRight` never flip pages while `tutor.isOpen()` is true; verify audio/SVG pause on open, resume on close, and page-switch context updates across pages and chapters.

## 4. End-to-End Integration & Cartridge Boundary Verification

- [x] 4.1 Verify on a local static server across desktop (`1280×800`) and mobile (`390×844`) viewports in both Light and Dark themes: ChatGPT default prefilled URL launch, Claude prefilled URL launch, Gemini clipboard copy + `gemini.google.com/app` launch with paste guidance, Copy Prompt action, long-question URL trimming (`<= 1950` chars), starter chips, keyboard shortcut isolation, zero horizontal overflow, zero uncaught console errors, and `node scripts/validate-cartridge.mjs` exiting `0` with zero changes to `content/` or `assets/`.

## Workflow follow-up

- Archive `add-ai-tutor-handoff` after implementation and verification pass.
