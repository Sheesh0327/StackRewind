# Proposal

## Why

StackRewind readers often want to ask follow-up questions about a page's engineering mechanism, historical trade-offs, or unfamiliar codex terms while reading. Because StackRewind is a 100% static, zero-backend site, embedding an LLM API directly in client JavaScript would expose API keys, and hosting a proxy introduces maintenance and rate-limit overhead. A page-aware AI Tutor handoff drawer lets readers type a question (or pick a starter prompt) and launch ChatGPT, Claude, or Gemini in a new tab with the current page's context pre-assembled—staying \$0 forever with zero backend, zero rate limits, and zero per-chapter authoring.

## What Changes

- **Dialogue-Anchored "Ask AI" Entry Point & Slide-Over Tutor Drawer**: Add a compact `"Ask AI"` button inside `.sr-dialogue-header` (`index.html`) that opens a top-layer `<dialog id="tutor-drawer">` reusing the slide-over drawer transitions, reduced-motion behavior, light-dismiss, and audio/SVG scene pause-on-open / resume-on-close coordination established by `js/codex.js`.
- **Page-Scoped Prompt Composer & URL-Budget Guard (`js/tutor.js`)**: Assemble a concise, mechanism-first CS tutor prompt from the active `state.volume`, `state.chapter`, current `page` (`page.tts` with bracket-stripping fallback from `page.dialogue`, plus optional `page.sceneNotes`), and only the codex definitions referenced on that page (`extractTermIds(page.dialogue)`). Enforce a safe encoded URL ceiling (`<= 1950` characters) for `?q=` handoffs via deterministic progressive context trimming while preserving the full prompt for clipboard copy and an expandable `<details>` preview.
- **Multi-Provider Handoff with ChatGPT Default**: Support **ChatGPT** (default, `https://chatgpt.com/?q=...`), **Claude** (`https://claude.ai/new?q=...`), **Gemini** (`https://gemini.google.com/app` via automatic clipboard copy + inline paste instruction since `gemini.google.com` ignores `?q=`), and **Copy Prompt** (clipboard-only). Persist the reader's selected provider in `localStorage` (`sr-tutor-provider`) with `try/catch` degradation, silently copy the prompt as a backup on URL handoffs, and handle popup blockers and clipboard failures gracefully.
- **Contextual Starter Chips & Dual-Theme Responsive Styling (`css/tutor.css`)**: Auto-generate 3 context-aware starter question chips from the current page and its codex terms, support `Ctrl+Enter` / `Cmd+Enter` submission, guard `ArrowLeft` / `ArrowRight` page shortcuts while the drawer is open, and style exclusively with `--sr-*` tokens for Warm Paper (Light) and Warm Paper Noir (Dark) across desktop (`1280×800`) and mobile (`390×844`) viewports.

## Capabilities

### New Capabilities
- `ai-tutor-handoff`: Dialogue-anchored slide-over AI Tutor drawer, page-scoped prompt assembly with encoded URL-length budgeting, ChatGPT-default multi-provider handoff (ChatGPT, Claude, Gemini copy-and-open, Copy Prompt), provider preference persistence, contextual starter chips, and dual-theme responsive Console integration.

### Modified Capabilities
<!-- None — existing Console reader and Cartridge contracts remain intact -->

## Impact

- **Console Files Added/Modified (Read-Only Engine Scope for Content Authors)**: `index.html`, `css/main.css`, `css/tutor.css` (new), `js/tutor.js` (new), `js/app.js`.
- **Cartridge Boundary Preserved**: Zero edits to `content/` or `assets/`—all existing and future chapters gain the AI Tutor automatically from existing JSON fields (`title`, `era`, `dialogue`, `tts`, `sceneNotes`, `codex`).
- **Runtime & Dependencies**: Vanilla HTML5, CSS3, and ES6 modules; zero external libraries, zero API keys, and zero backend infrastructure.
