# Tasks

## 1. Dual-Scheme Markup & CSS Tokens (`index.html`, `css/main.css`, `css/codex.css`)

- [x] 1.1 Update `<meta name="color-scheme" content="light dark">` in `index.html`, add the minimal `try/catch` inline `<head>` FOUC-prevention script reading `localStorage.getItem("sr-color-scheme")`, and add the compact `#theme-toggle` button inside `.sr-masthead-actions`; verify on a local static server that `<meta name="color-scheme">` defaults to `"light dark"` and reflects any pre-seeded `localStorage` value before first paint without console errors.
- [x] 1.2 Refactor `:root` tokens and surfaces in `css/main.css` and `css/codex.css` to map `<meta name="color-scheme">` overrides (`:root:has(> head > meta[name="color-scheme"][content="dark" | "light"])`) and style both Light ("Archival Paper Glass") and Dark ("Obsidian Glass") modes via `light-dark()` with `@supports` / `prefers-color-scheme` fallbacks, preserving text-only `.codex-term` highlights and Cartridge `--sr-*` inheritance; verify via DevTools computed styles in both `prefers-color-scheme: light` and `dark` that Console surfaces, Codex Drawer, and Page 2 SVG scene contrast cleanly with zero `content/` edits.

## 2. Theme Controller & Cross-Viewport Verification (`js/theme.js`, `js/app.js`)

- [x] 2.1 Implement `js/theme.js` and wire it into `js/app.js` to drive `#theme-toggle` with two-state OS-reversion semantics (storing `"light"`/`"dark"` in `localStorage` only when diverging from `matchMedia("(prefers-color-scheme: dark)")`, removing the key when matching OS, keeping pinned overrides across OS changes, and syncing across tabs via `window` `"storage"` events); verify in browser by toggling Light/Dark, reloading with persistence intact, toggling back to match OS (confirming `localStorage` key removal), and simulating a `storage` event from another tab.
- [x] 2.2 Run an end-to-end integration check across desktop (`1280×800`) and mobile (`390×844`) viewports covering Cover Card, Page 1 blueprint fallback + text-only Codex terms, Page 2 SVG scene, Archive Switcher, and Codex Drawer in both Light and Dark themes; confirm zero masthead overlap, zero horizontal overflow, zero Cartridge file changes, and zero console errors.

## Workflow follow-up

- Archive `add-theme-picker` after implementation and verification pass.
