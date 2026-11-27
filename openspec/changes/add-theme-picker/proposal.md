# Proposal

## Why

StackRewind currently hardcodes dark mode (`color-scheme: dark` and Obsidian Glass tokens), giving readers no way to adapt the reader to bright ambient environments, personal visual contrast preferences, or their OS color-scheme setting. Adding a light/dark theme picker lets readers switch comfortably between high-contrast Light ("Archival Paper Glass") and Dark ("Obsidian Glass") themes—while following OS `prefers-color-scheme` by default—without breaking the strict Console-vs-Cartridge boundary.

## What Changes

- **System-Default Dual Color Scheme & FOUC Prevention**: Update `<meta name="color-scheme">` in `index.html` to `"light dark"` and add a minimal synchronous inline `<head>` script that applies any persisted `localStorage` override (`sr-color-scheme`) before first paint so reloads never flash the wrong theme.
- **Masthead Two-State Light/Dark Theme Toggle**: Add a compact accessible theme toggle button in `.sr-masthead-actions` backed by a dedicated `js/theme.js` module (wired in `js/app.js`) that flips between the opposite rendered scheme, stores explicit user overrides, reverts cleanly to OS-following (`"light dark"`) when toggled back to match the OS preference, and syncs across browser tabs via `storage` events.
- **Dual-Scheme `--sr-*` CSS Token Contract**: Upgrade `css/main.css` and `css/codex.css` so `:root` maps `<meta name="color-scheme">` overrides (`light` / `dark`) to `color-scheme`, uses `light-dark()` (with `@supports` / `prefers-color-scheme` fallbacks) for all Console surfaces, gradients, shadows, text-only `.codex-term` highlights, and `<dialog id="codex-drawer">`, and propagates theme-adapted `--sr-*` custom properties to existing and future Cartridge SVG scenes with zero Cartridge edits.

## Capabilities

### New Capabilities
- `theme-picker`: System-default light/dark color-scheme support, FOUC-free `localStorage` persistence, masthead two-state theme toggle with OS-reversion semantics, cross-tab sync, and dual-scheme `--sr-*` Console & Cartridge styling.

### Modified Capabilities
<!-- None — init-stackrewind-core has not yet been archived to openspec/specs/, and existing core reader requirements remain intact -->

## Impact

- **Console Files Modified/Added (Read-Only Engine)**: `index.html`, `css/main.css`, `css/codex.css`, `js/theme.js` (new), `js/app.js`.
- **Cartridge Boundary Preserved**: Zero changes to `content/` or `assets/`—SVG scenes (`content/<vol>/scenes/*.js`) inherit updated `--sr-*` tokens automatically.
- **Runtime & Dependencies**: Vanilla HTML5, CSS3 (`color-scheme`, `light-dark()`, `:has()`), and ES6 modules; zero external libraries or build steps.
