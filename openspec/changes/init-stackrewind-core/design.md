# Design

## Context

**StackRewind** is a greenfield static web application deployed directly to Cloudflare Pages from the repository root (`index.html`, zero build step, zero external dependencies). See `proposal.md` for motivation and capability scope. The architecture enforces a strict **Console vs. Cartridge** separation: the **Console** (`index.html`, `css/`, `js/`) is an immutable reader engine, while **Content Cartridges** (`content/` and `assets/`) hold all chapter data, codex glossaries, vector scene modules, panels, and voiceovers authored asynchronously by external agents (such as Codex).

## Goals / Non-Goals

**Goals:**
- Deliver an atmospheric, high-contrast **editorial dark-mode graphic novel reader** ("retro engineering archive meets clean manga reader") across desktop and mobile viewports.
- Enforce a hard filesystem boundary where `index.html`, `css/`, and `js/` are **100% read-only Console**, and `content/` + `assets/` hold all writable Cartridges.
- Enable conflict-free parallel authoring across chapters via chapter-scoped `codex` dictionaries and `ch<N>-*` scene module prefixes, backed by `content/README.md` and non-blocking `[Cartridge Check]` DevTools diagnostics.
- Guarantee polished fallback behavior before `.webp` panels or `.mp3` voiceovers exist via 16:9 SVG blueprint placeholders and error-free audio fallback states.
- Partition implementation into ~100–200 LOC vertical slices verifiable locally with `python -m http.server`.

**Non-Goals:**
- Build pipelines, bundlers, npm packages, TypeScript compilation, or server-side rewrite rules.
- Overlaid comic speech bubbles inside panel art (all dialogue renders in a dedicated tray below the 16:9 frame so artwork and vector diagrams are never obstructed).
- Authoring real networking history dialogue, real glossary explanations, or production SVG animations during this change (only a 2-page dummy fixture is scaffolded).

## Decisions

### 1. Editorial Dark-Mode Visual System & `--sr-*` Theme Contract (`css/main.css`, `css/codex.css`)

- **Shared `:root` CSS Custom Properties** (consumed by both Console UI and Cartridge SVG scenes):
  - `--sr-bg-canvas: #0b0d10` (deep obsidian archive background)
  - `--sr-bg-surface: #12161c` / `--sr-bg-elevated: #191f28` (blueprint slate cards, dialogue tray, drawer)
  - `--sr-border: #262f3d` / `--sr-border-strong: #38465b` (crisp 1px editorial frame rules)
  - `--sr-ink: #edf0f5` / `--sr-ink-secondary: #98a3b3` / `--sr-ink-muted: #667387` (warm archival paper ink hierarchy)
  - `--sr-amber: #f59e0b` / `--sr-amber-soft: rgba(245, 158, 11, 0.14)` (active codex highlight pills, `Start Chapter` CTA, archival scrubber progress, SVG accent strokes)
  - `--sr-font-display: Georgia, "Times New Roman", serif`
  - `--sr-font-sans: system-ui, -apple-system, "Segoe UI", sans-serif`
  - `--sr-font-mono: ui-monospace, "Cascadia Code", Consolas, monospace`
- **Viewport Stage Composition**:
  1. **Top Masthead**: Centralized **StackRewind** brand mark, **Archive Switcher** menu (published chapters clickable; `"coming-soon"` volumes dimmed), and `Chapter Glossary` button.
  2. **Chapter Cover Card (Entry Gate)**: Centered archival dossier card displaying volume badge, era tag, chapter title/subtitle, brand tagline, and prominent amber `Start Chapter` CTA.
  3. **16:9 Panel Stage**: `aspect-ratio: 16 / 9` framed stage (`max-width: 960px` centered) with subtle corner ticks and a `180ms` motion-safe page-turn transition (`prefers-reduced-motion: reduce` respected).
  4. **Anchored Dialogue Tray**: Positioned directly beneath the 16:9 frame with speaker nameplate badge and legible copy (`clamp(1rem, 0.35vw + 0.92rem, 1.15rem)`, `line-height: 1.65`) containing `[[Term|id]]` highlight pills.
  5. **Archival Transport & Pagination Bar**: Single-row strip on desktop (Play/Pause, Replay, timeline range scrubber + time/status readout on the left; `Prev`, `Page X / Y`, `Next` / `Next Chapter →` on the right) reflowing cleanly into two stacked rows below `680px`.
- **Alternatives considered**: Floating translucent subtitle overlays inside the 16:9 frame — rejected because multi-sentence dialogue crowds mobile 16:9 viewports and obscures vector diagram labels.

### 2. Console vs. Cartridge Filesystem Boundary & Runtime Flow

**Architectural Guardrail:** Adding a new chapter or future volume (`operating-systems`, `cybersecurity`) MUST require **zero edits** to `index.html`, `css/`, or `js/`. Authors only update `content/manifest.json` and drop files into `content/<volume>/` and `assets/{panels,audio}/`.

```text
/
├── index.html                              # [Console — Read-Only] Shell, Archive Switcher, Cover Card, 16:9 Stage, Bar, <dialog>
├── css/
│   ├── main.css                            # [Console — Read-Only] --sr-* tokens, Masthead/Switcher, Cover Card, Stage, Tray, Bar
│   └── codex.css                           # [Console — Read-Only] Highlight pills, slide-over <dialog>, glossary list, mobile rules
├── js/
│   ├── app.js                              # [Console — Read-Only] Manifest/switcher, hash router, stage host, [Cartridge Check]
│   ├── parser.js                           # [Console — Read-Only] XSS-safe [[Term|id]] dialogue tokenizer into highlight buttons
│   ├── audio.js                            # [Console — Read-Only] HTML5 <audio> player, autoplay gate, missing-MP3 state, preloader
│   └── codex.js                            # [Console — Read-Only] Audio/scene auto-pause coordinator, Codex Drawer & Glossary
├── content/
│   ├── README.md                           # [Cartridge Spec] Standalone contract guide for Codex (schemas, hooks, --sr-* tokens)
│   ├── manifest.json                       # [Cartridge Index] Centralized StackRewind branding + multi-volume/chapter registry
│   └── networking/
│       ├── chapter1.json                   # [Cartridge] Self-contained 2-page dummy fixture + chapter-scoped codex
│       └── scenes/
│           └── ch1-demo-placeholder.js     # [Cartridge] Pluggable SVG module (ch<N>-* prefix for parallel authoring)
└── assets/
    ├── panels/                             # [Cartridge Media] Flat <vol>-ch<num>-p<00>.webp drops (.gitkeep initially)
    └── audio/                              # [Cartridge Media] Flat <vol>-ch<num>-p<00>.mp3 drops  (.gitkeep initially)
```

- **Runtime Execution Flow**:
  1. **Bootstrap & Route Check:** `app.js` reads `content/manifest.json`, populates centralized branding and the Masthead Archive Switcher, and resolves `window.location.hash` (e.g., `#networking/ch1/2`, clamping out-of-bounds routes).
  2. **Autoplay Entry Gate:** Clicking **Start Chapter** on the Cover Card unlocks browser audio playback, loads/validates the routed chapter JSON (`[Cartridge Check]`), and opens the target page.
  3. **Per-Page Fan-Out:** On each page render, `app.js` fans out across three concerns:
     - **16:9 Stage (`app.js`):** Renders `<img>` (with styled SVG blueprint fallback) for `"panelType": "image"`, or calls `unmount()` on any active scene, sets `stageEl.dataset.scene = page.sceneModule`, dynamically `import()`s `../content/<vol>/scenes/<sceneModule>.js` (resolved via `import.meta.url`), and calls `mount(stageEl, context)` for `"panelType": "svg-scene"`.
     - **`parser.js`:** Converts inline `[[Term|id]]` dialogue tokens into accessible clickable highlight `<button>` elements.
     - **`audio.js`:** Loads the active page's `.mp3` (degrading cleanly to `"Audio not yet loaded"` when absent) and silently preloads `page + 1`'s panel/scene and `.mp3`.
  4. **Active Codex & Playback Coordination:** Clicking an inline term, an SVG scene hotspot (`context.openCodex(termId)`), or `Chapter Glossary` triggers `codex.js` to pause `audio.js` and invoke the active scene's optional `pause?.()` hook (remembering prior playback state) before opening `<dialog id="codex-drawer">`.
  5. **Chapter-End Handoff:** On `Page N / N`, `app.js` checks `content/manifest.json` for a subsequent published chapter in the active volume; if present, `Next` becomes **`Next Chapter →`** (`#<vol>/<nextCh>/1`), otherwise rendering disabled at chapter end.
- **Alternatives considered**: Keeping scenes inside `js/scenes/` — rejected so `js/` remains 100% immutable Console code and authoring agents only need write access to `content/` and `assets/`.

### 3. Cartridge Schemas & Parallel-Safe Ownership

#### `content/manifest.json`
```json
{
  "brand": {
    "name": "StackRewind",
    "tagline": "Rewind the stack to the problem that created it."
  },
  "defaultRoute": {
    "volume": "networking",
    "chapter": "ch1"
  },
  "volumes": [
    {
      "id": "networking",
      "number": 1,
      "code": "net",
      "title": "Networking",
      "status": "published",
      "chapters": [
        {
          "id": "ch1",
          "number": 1,
          "era": "1960–1969",
          "title": "Why Packets Exist",
          "subtitle": "Placeholder subtitle for Console verification.",
          "dataPath": "content/networking/chapter1.json"
        }
      ]
    },
    {
      "id": "operating-systems",
      "number": 2,
      "code": "os",
      "title": "Operating Systems",
      "status": "coming-soon",
      "chapters": []
    },
    {
      "id": "cybersecurity",
      "number": 3,
      "code": "sec",
      "title": "Cybersecurity",
      "status": "coming-soon",
      "chapters": []
    }
  ]
}
```

#### `content/networking/chapter1.json` (Self-Contained Schema & 2-Page Dummy Fixture)
Each `chapter<N>.json` owns its complete `codex` map so parallel agents authoring Chapters 2, 3, etc. never contend on a shared glossary file:

```json
{
  "volumeId": "networking",
  "chapterId": "ch1",
  "chapterNumber": 1,
  "assetPrefix": "net-ch1",
  "era": "1960–1969",
  "title": "Why Packets Exist",
  "subtitle": "Placeholder subtitle for Console verification.",
  "pages": [
    {
      "page": 1,
      "panelType": "image",
      "title": "Dummy Image Panel",
      "speaker": "Placeholder Speaker",
      "dialogue": "Placeholder narration testing [[Alpha Token|dummy-alpha]] and [[Beta Token|dummy-beta]] inline inspection.",
      "sceneNotes": "Placeholder 16:9 framing notes verifying the missing-image SVG blueprint fallback."
    },
    {
      "page": 2,
      "panelType": "svg-scene",
      "sceneModule": "ch1-demo-placeholder",
      "title": "Dummy Vector Scene",
      "speaker": "Placeholder Speaker",
      "dialogue": "Placeholder narration testing dynamic ES6 SVG scene mounting, CSS scoping, and cleanup.",
      "sceneNotes": "Placeholder framing notes for the pluggable svg-scene lifecycle."
    }
  ],
  "codex": {
    "dummy-alpha": {
      "term": "Alpha Token",
      "plainEnglish": "Placeholder plain-English definition for Alpha Token.",
      "whyItWasInvented": "Placeholder historical crisis summary for Alpha Token.",
      "realWorldSighting": "Placeholder modern sighting example for Alpha Token."
    },
    "dummy-beta": {
      "term": "Beta Token",
      "plainEnglish": "Placeholder plain-English definition for Beta Token.",
      "whyItWasInvented": "Placeholder historical crisis summary for Beta Token.",
      "realWorldSighting": "Placeholder modern sighting example for Beta Token."
    }
  }
}
```

- **Deterministic Path Resolution** (`pad = String(page).padStart(2, "0")`):
  - Panel image (`"panelType": "image"`): `assets/panels/${assetPrefix}-p${pad}.webp`
  - Scene module (`"panelType": "svg-scene"`): `new URL(\`../content/${chapter.volumeId}/scenes/${page.sceneModule}.js\`, import.meta.url).href`
  - Voiceover audio: `assets/audio/${assetPrefix}-p${pad}.mp3`
- **Alternatives considered**: Shared volume-wide `codex.json` — rejected to prevent git merge conflicts when parallel agents author separate chapters simultaneously.

### 4. Progressive SVG Scene Contract, CSS Sandboxing & Diagnostics

- **Progressive Scene Module Exports (`content/<vol>/scenes/ch<N>-<name>.js`)**:
  ```js
  // Required
  export function mount(stageEl, context) { /* render into 16:9 stageEl */ }
  export function unmount() { /* cancel timers, RAFs, or listeners */ }

  // Optional — automatically called by Console when present
  export function pause() {}
  export function resume() {}
  export function replay() {}
  ```
- **Sandboxed Stage Context & Scoping**:
  - `context` provides `{ page, chapter, reducedMotion, openCodex: (termId) => ... }`.
  - Before calling `mount`, `app.js` sets `stageEl.dataset.scene = page.sceneModule` (removing it after `unmount()`). Inline `<svg><style>` rules inside a cartridge MUST prefix selectors with `[data-scene="<sceneModule>"]` and reference `--sr-*` CSS custom properties so global Console styles are never polluted.
  - A monotonic `renderToken` guards async `import()` resolution so rapid page turns never mount a stale scene; failed imports/mounts fall back to the 16:9 SVG blueprint placeholder.
- **Non-Blocking `[Cartridge Check]` Validator (`js/app.js`)**:
  ~25-LOC check run on chapter JSON load and scene import that logs `console.warn("[Cartridge Check] ...")` if required chapter/page fields are missing, an inline `[[Term|id]]` has no matching key in `chapter.codex`, or an `"svg-scene"` module lacks `mount`/`unmount` functions—giving authoring agents instant browser feedback without breaking end-user rendering.
- **Alternatives considered**: Shadow DOM encapsulation per scene — rejected so scenes can effortlessly inherit `:root` `--sr-*` typography and color tokens without stylesheet cloning boilerplate.

### 5. Safe Token Parsing (`js/parser.js`), Audio Resilience (`js/audio.js`) & Codex Drawer (`js/codex.js`)

- **XSS-Safe Tokenizer (`js/parser.js`)**: Splits `page.dialogue` with `/\[\[([^\]|]+)\|([^\]]+)\]\]/g`, returning a `DocumentFragment` composed exclusively with `document.createTextNode()` and `<button type="button" class="codex-term" data-term-id="...">` (rendering unmatched IDs as plain text).
- **Audio Lifecycle & Preloader (`js/audio.js`)**: Reuses a single `Audio` instance unlocked by `Start Chapter`; halts and resets to `0:00` on page turns; catches `error` events and rejected `play()` promises to render `"Audio not yet loaded"` cleanly; notifies `app.js` on Play/Pause/Replay so active `svg-scene` optional hooks stay synchronized; and preloads `page + 1` assets once per session via a deduplicated `Set`.
- **Native `<dialog>` Drawer (`js/codex.js`)**: Uses `<dialog id="codex-drawer">.showModal()` for top-layer focus trapping, `::backdrop`, `Escape` handling, and backdrop click dismissal (`event.target === dialog`), while suppressing `ArrowLeft`/`ArrowRight` page turns when open.

## Risks / Trade-offs

- **[Browser refresh on `#networking/ch1/2` resets browser autoplay permission]** → Show the Chapter Cover Card on fresh document load with context-aware CTA copy (`Continue Chapter — Page 2`) so the deep-linked page is preserved AND voiceover playback unlocks cleanly on click.
- **[Unscoped `<svg><style>` in a future Cartridge leaking into Console UI]** → Document mandatory `[data-scene="<sceneModule>"]` selector scoping in `content/README.md` and clear `stageEl` inner DOM completely on every `unmount()`.
- **[DevTools Network panel logs HTTP 404 for absent `.webp` / `.mp3` files]** → Expected on static servers prior to media drops; mitigated by catching all media errors in JS and deduplicating preload attempts per session.
