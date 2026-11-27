# Design

## Context

StackRewind currently locks `index.html` and `css/main.css` to `color-scheme: dark` with Obsidian Glass dark-mode tokens (`--sr-*`). Existing and future Cartridge SVG scenes (`content/<vol>/scenes/*.js`) consume `--sr-*` custom properties (`--sr-bg-surface`, `--sr-bg-elevated`, `--sr-border`, `--sr-border-strong`, `--sr-ink`, `--sr-ink-secondary`, `--sr-ink-muted`, `--sr-amber`, `--sr-amber-soft`) directly without defining colors of their own. See `proposal.md` for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Follow the OS color scheme by default (`light dark`) and support manual override switching between **Obsidian Glass** (Dark) and **Archival Paper Glass** (Light) from a compact masthead toggle.
- Prevent flash of un-themed content (FOUC) on page load and keep overrides synced across tabs.
- Adapt all Console UI and inherited Cartridge `--sr-*` tokens cleanly using native CSS `color-scheme` + `light-dark()` with fallbacks for older engines.
- Keep `content/` and `assets/` 100% untouched.

**Non-Goals:**
- Multi-hue theme studios (cyan, sepia, etc.) in the production Console UI (only Light and Dark schemes).
- Persisting theme state server-side or exposing a separate settings modal for a single binary light/dark toggle.
- Modifying Cartridge JSON schemas or SVG scene modules.

## Decisions

### 1. `<meta name="color-scheme">` + `:root:has(...)` Cascade Mapping (`index.html`, `css/main.css`)
- **Decision**: Declare `<meta name="color-scheme" content="light dark">` in `index.html`, immediately followed by a minimal synchronous non-module `<script>` that reads `localStorage.getItem("sr-color-scheme")` inside `try/catch` and sets `meta.content` to `"light"`, `"dark"`, or `"light dark"`.
- In `css/main.css`, `:root` sets `color-scheme: light dark;` as the base rule and maps explicit `<meta>` overrides via CSS `:has()`:
  ```css
  :root {
    color-scheme: light dark;
    &:has(> head > meta[name="color-scheme"][content="dark"]) { color-scheme: dark; }
    &:has(> head > meta[name="color-scheme"][content="light"]) { color-scheme: light; }
  }
  ```
- **Rationale**: Setting `<meta>` alone is overridden by any author `color-scheme` rule on `:root`, so mapping `<meta>` back to `:root`'s `color-scheme` ensures CSS `light-dark()` tokens, native scrollbars, `<dialog>`, and `accent-color` respond immediately to both OS changes and manual overrides—even if module JS fails to load.
- **Alternatives considered**: Applying a `.theme-light`/`.theme-dark` class on `<html>` — rejected because duplicating token overrides across both `@media (prefers-color-scheme)` and JS classes is error-prone and breaks native `light-dark()` coherence.

### 2. Dual-Scheme `--sr-*` Token Palette & Browser Fallback (`css/main.css`, `css/codex.css`)
- **Decision**: Define explicit `--sr-*-light` and `--sr-*-dark` raw values on `:root`, resolve them via `light-dark(lightVal, darkVal)` inside `@supports (color: light-dark(white, black))`, and provide a baseline light-default + `@media (prefers-color-scheme: dark)` + `:root:has(> head > meta[name="color-scheme"][content="..."])` fallback for browsers without `light-dark()`.
- **Palette Pairing**:
  - **Dark ("Obsidian Glass")**: Preserves the existing verified Obsidian Glass tokens (`--sr-bg-canvas: #090b0f`, `--sr-bg-surface: #12161d`, `--sr-bg-elevated: #181e27`, `--sr-ink: #edf0f5`, `--sr-ink-secondary: #98a3b3`, `--sr-amber: #f59e0b`, vertical cool-slate surface gradients with `1px` top inner sheen).
  - **Light ("Archival Paper Glass")**: Warm editorial alabaster canvas (`#f6f7f9`) with subtle top-glow aura (`rgba(15, 23, 42, 0.045)`), crisp white-to-cool-alabaster card gradients (`rgba(255, 255, 255, 0.96)` → `rgba(243, 245, 249, 0.92)`), hairline borders (`rgba(15, 23, 42, 0.09)` / `0.16`), deep slate ink (`#111827` primary, `#4b5563` secondary, `#6b7280` muted), and deepened amber (`#b45309` / hover `#92400e`) for >= 4.5:1 WCAG AA contrast on light surfaces (using `#fff` text on primary amber CTA gradients).
- **Text-Only Codex Terms & Speaker Badge**: `.codex-term` keeps zero encapsulating box/border in both modes (`color: var(--sr-amber)`, underline on hover); `.sr-speaker-badge` keeps its amber dot + mono text treatment.
- **Native Scrollbar & Selection Polish**: Apply `scrollbar-color` via `light-dark()` tokens on `:root` without transitioning it (avoiding WebKit flicker).

### 3. Two-State Masthead Toggle & OS-Reversion State Machine (`js/theme.js`, `js/app.js`)
- **Decision**: Place a compact icon+label button (`#theme-toggle`) in `.sr-masthead-actions` beside `Chapter Glossary`. Follow the two-state override pattern:
  - Determine `systemScheme` via `window.matchMedia("(prefers-color-scheme: dark)")` (listening to its `change` event).
  - `renderedScheme` = stored `"light"`/`"dark"` if present, else `systemScheme`.
  - On click: `target = renderedScheme === "dark" ? "light" : "dark"`.
    - If `target !== systemScheme`: persist `localStorage.setItem("sr-color-scheme", target)` and set `<meta>` content to `target`.
    - If `target === systemScheme`: call `localStorage.removeItem("sr-color-scheme")` and set `<meta>` content to `"light dark"` so OS-following resumes cleanly.
  - **Crucial Guard**: Never inspect `matchMedia` `change` events to delete a stored override—if the OS later switches to match a pinned scheme, keep the stored override intact.
  - Listen to `window` `"storage"` events on key `"sr-color-scheme"` to synchronize `<meta>` content and toggle UI across tabs.
- **Accessibility & Toggle Label**: Display both theme states in markup (or update `aria-label` + visible icon/short label dynamically, e.g., sun/moon SVG + `"Light"`/`"Dark"` or `"Switch to light theme"` / `"Switch to dark theme"`) and keep compact padding so mobile (`390px`) `.sr-masthead-actions` (`Archive Switcher`, `Chapter Glossary`, `Theme`) stays within a single clean second row with zero overflow.

## Risks / Trade-offs

- **[Crowding `.sr-masthead-actions` on 390px mobile]** → Keep `#theme-toggle` compact (`min-width` icon + short label or icon-only with `aria-label` below `420px`) and allow `.sr-masthead-actions` to wrap gracefully if needed so zero horizontal overflow occurs.
- **[Cartridge SVG scenes hardcoding dark-only hex colors]** → Existing `ch1-demo-placeholder.js` already uses `var(--sr-*)` tokens exclusively; future scenes documented in `content/README.md` use the same `--sr-*` tokens, so both light and dark modes stay legible automatically.
- **[Browsers without CSS `:has()` or `light-dark()`]** → For broader resilience, `js/theme.js` can also mirror `data-color-scheme="light" | "dark"` only when needed? No—`:has()` is Baseline Widely Available (Chrome 105+, Edge 105+, Firefox 121+, Safari 15.4+), while `light-dark()` is guarded with `@supports` + `:root:has(...)` fallback rules.
