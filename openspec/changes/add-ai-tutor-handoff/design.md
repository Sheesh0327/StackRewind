# Design

## Context

StackRewind is a zero-build static web reader (`index.html`, `css/`, `js/`) with a strict Console-vs-Cartridge separation (`content/` and `assets/` must remain untouched by Console features). In `js/app.js`, the Console already maintains `state.volume`, `state.chapter`, `state.pageIndex`, and `state.activeScene`, while `js/codex.js` establishes the top-layer slide-over `<dialog>` drawer pattern (`closedby="any"`, `allow-discrete` transitions, `onBeforeOpen` / `onAfterClose` audio & scene coordination), and `js/parser.js` exports `extractTermIds(dialogueText)`. See `proposal.md` for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Provide a zero-cost, zero-backend, page-aware AI Tutor handoff drawer directly inside the Console so every existing and future cartridge gains tutoring support automatically.
- Default to ChatGPT (`chatgpt.com/?q=...`) while supporting Claude (`claude.ai/new?q=...`), Gemini (`gemini.google.com/app` via automatic clipboard copy + paste cue), and Copy Prompt.
- Keep URL-encoded handoffs within safe browser limits (`<= 1950` chars) without truncating the reader's question.
- Preserve popup-blocker immunity by executing `window.open` synchronously within the user gesture handler.

**Non-Goals:**
- Calling LLM HTTP APIs from browser JavaScript, deploying a serverless proxy, or managing API keys/OAuth tokens.
- Modifying `content/` JSON schemas or adding per-chapter tutor metadata.
- Maintaining multi-turn chat history inside StackRewind once the reader hands off to the external chat tab.

## Decisions

### 1. Trigger Placement in `.sr-dialogue-header` (`index.html`, `css/main.css`)
- **Decision**: Place `#ask-tutor-btn` inside `.sr-dialogue-header` alongside the speaker badge and scene title (rather than adding a fourth control to `.sr-masthead-actions`).
- **Rationale**: `.sr-masthead-actions` already holds Archive Switcher, Theme Toggle, and Chapter Glossary, which fill a full row on `390px` mobile viewports. Placing `"Ask AI"` inside the dialogue header pairs the tutor directly with the page text the reader is questioning and avoids masthead crowding.
- **Alternatives considered**: Adding a button to the masthead or a floating bottom-right FAB — rejected because masthead wraps poorly below `390px` and a FAB obscures the control bar/stage on small screens.

### 2. Dedicated `js/tutor.js` & `css/tutor.css` Mirroring `js/codex.js` / `css/codex.css`
- **Decision**: Implement `createTutorController(...)` in `js/tutor.js` and style `<dialog id="tutor-drawer">` in `css/tutor.css`, reusing the `.sr-codex-drawer` slide-over `<dialog>` geometry, `allow-discrete` + `@starting-style` transitions, `prefers-reduced-motion` handling, `closedby="any"` + backdrop fallback, and `onBeforeOpen` / `onAfterClose` lifecycle hooks.
- **Rationale**: Keeps `js/codex.js` focused on glossary rendering while guaranteeing identical drawer physics, accessibility, and audio/SVG scene pause-resume coordination in `js/app.js`.
- **Keyboard & State Coordination in `js/app.js`**:
  - Extend the global `keydown` guard in `js/app.js` from `if (codex.isOpen() || !state.entered)` to `if (codex.isOpen() || tutor.isOpen() || !state.entered)`.
  - Share the `wasAudioPlayingBeforeOverlay` coordination pattern across both Codex and Tutor drawers.
  - Call `tutor.setContext({ volume: state.volume, chapter: state.chapter, page, pageIndex: state.pageIndex })` inside `renderPage()`, clearing stale status notices (and resetting page-specific starter chips) when the page changes.

### 3. Provider Registry & Gemini Workaround (`js/tutor.js`)
- **Decision**: Define a declarative `PROVIDERS` registry in `js/tutor.js` with `"chatgpt"` as the default (`STORAGE_KEY = "sr-tutor-provider"`):
  - `chatgpt`: `{ label: "ChatGPT", mode: "url", buildUrl: (q) => "https://chatgpt.com/?q=" + encodeURIComponent(q), cta: "Send to ChatGPT" }`
  - `claude`: `{ label: "Claude", mode: "url", buildUrl: (q) => "https://claude.ai/new?q=" + encodeURIComponent(q), cta: "Send to Claude" }`
  - `gemini`: `{ label: "Gemini", mode: "clipboard-open", url: "https://gemini.google.com/app", cta: "Copy & Open Gemini" }`
  - `copy`: `{ label: "Copy Prompt", mode: "clipboard-only", cta: "Copy Prompt" }`
- **Rationale**: `gemini.google.com/app` ignores `?q=` query parameters, whereas `chatgpt.com/?q=` and `claude.ai/new?q=` natively prefill prompts. Treating Gemini explicitly as `clipboard-open` gives readers a reliable 1-step paste flow instead of dropping them into a blank Gemini box with lost context.
- **Alternatives considered**: Passing `?q=` to Gemini anyway — rejected because verified behavior shows `gemini.google.com/app` discards query params, causing silent context loss.

### 4. Synchronous User-Gesture `window.open` + Parallel Clipboard Backup
- **Decision**: On form submit for `url` or `clipboard-open` providers, compute the prompt and target URL synchronously, call `const popup = window.open(targetUrl, "_blank", "noopener,noreferrer")` **first** inside the click/submit event stack (never after `await navigator.clipboard.writeText(...)`), and fire clipboard copy in parallel (with a `try/catch` / `.catch()` fallback).
- **Rationale**: Awaiting `navigator.clipboard.writeText()` before calling `window.open()` drops transient user activation in Safari and strict browsers, triggering popup blockers. Calling `window.open()` synchronously preserves the user gesture while still copying the prompt to the clipboard.
- **Fallback**: If `popup === null` (popup blocked), render an inline status notice containing an explicit clickable `<a href="..." target="_blank" rel="noopener noreferrer">` fallback link alongside confirmation that the prompt was copied.

### 5. Page-Scoped Prompt Composition & Progressive URL-Length Trimmer
- **Decision**: Build prompts using existing cartridge fields only:
  - Header: Volume title, Chapter number/title/era, Page `N / total` + page title.
  - Excerpt: `page.tts` when present, otherwise `page.dialogue` with `[[Display|term-id]]` tokens stripped to `Display`.
  - Visual context: `page.sceneNotes` (when present).
  - Key terms: Deduplicated `extractTermIds(page.dialogue)` mapped to `chapter.codex[id]` (`term`: `plainEnglish`), capped cleanly to active-page terms only.
  - Reader question + brief tutor instruction ("Explain the concrete engineering mechanism clearly, stay anchored to this topic, and suggest 1 follow-up question.").
- **URL Budget Guard (`MAX_ENCODED_URL_CHARS = 1950`)**: For `mode: "url"` providers (`chatgpt`, `claude`), test `buildUrl(prompt).length`. If it exceeds `1950`, progressively drop/trim optional context in order:
  1. Omit `sceneNotes`.
  2. Drop codex definitions from last to first.
  3. Truncate the page excerpt (down to a minimum ~180 chars with ellipsis).
  4. Only if the reader's own question alone exceeds the URL cap, clip the encoded payload safely and rely on the parallel full-prompt clipboard backup + inline notice.
- **Rationale**: URL encoding expands spaces (`%20`), newlines (`%0A`), and punctuation by ~30–40%. Keeping encoded URLs `<= 1950` chars prevents HTTP 414 errors or silent browser truncation while always preserving the full untrimmed prompt in the collapsible preview and clipboard.

### 6. Contextual Starter Chips & Dual-Theme Tokens (`css/tutor.css`)
- **Decision**: Derive 3 compact starter chips per page in `js/tutor.js` (e.g., `"Explain <First Codex Term> simply"`, `"Why was this mechanism invented?"`, `"Quiz me on this page"`), falling back to generic page-mechanism chips when a page has zero codex tokens. Style all chips, provider pills, textarea, preview `<details>`, and status banners exclusively with existing `--sr-*` CSS tokens (`--sr-bg-elevated`, `--sr-border`, `--sr-amber`, `--sr-amber-soft`, `--sr-ink`, etc.).
- **Rationale**: Gives hesitant readers zero-typing entry points while guaranteeing Warm Paper (Light) and Warm Paper Noir (Dark) parity with zero new color tokens required.

## Risks / Trade-offs

- **[Upstream chat provider URL syntax changes]** → Isolate provider URL builders in one `PROVIDERS` map in `js/tutor.js` and always run the clipboard backup copy so readers never lose their typed question or page context even if a provider changes its `?q=` query handling.
- **[Browser popup blockers]** → Avoid `await` before `window.open`, and render a direct fallback anchor inside the drawer status region whenever `window.open` returns `null`.
- **[Clipboard permission denied on insecure origins or restricted browsers]** → Wrap `navigator.clipboard.writeText` in `try/catch`; on failure (especially for Gemini or Copy Prompt), automatically open the `<details>` prompt preview and focus/select a fallback copyable block with clear instructions.
- **[Empty or whitespace-only question submission]** → Validate `questionInput.value.trim()` before launching a tab and show inline guidance + focus the textarea.
