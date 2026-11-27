# Tasks

<!-- Strict Console vs. Cartridge layout (see design.md Decision 2):
     Read-Only Console: index.html, css/{main,codex}.css, js/{app,parser,audio,codex}.js
     Writable Cartridges: content/README.md, content/manifest.json, content/<vol>/chapter<N>.json,
                          content/<vol>/scenes/ch<N>-<scene>.js, assets/{panels,audio}/ -->

## 1. Workspace Scaffold, Cartridge Spec & Dummy Fixture

- [x] 1.1 (~130–165 LOC) Create the Console & Cartridge folder layout (`assets/panels/.gitkeep`, `assets/audio/.gitkeep`), centralized catalog (`content/manifest.json` with `Networking` plus `coming-soon` `Operating Systems` and `Cybersecurity`), and semantic `index.html` Console shell (masthead with Archive Switcher & `Chapter Glossary` trigger, Chapter Cover Card, 16:9 stage, dialogue tray, archival player/nav bar, `<dialog id="codex-drawer">`); verify via `python -m http.server 8000` at `http://localhost:8000` that semantic landmarks render and `/content/manifest.json` loads with zero console errors.
- [x] 1.2 (~120–165 LOC) Author `content/README.md` (standalone Cartridge contract covering schemas, self-contained `codex`, `[[Term|id]]` syntax, `ch<N>-*` progressive hooks, `context.openCodex`, `--sr-*` tokens, `[data-scene]` scoping, and `assets/` naming) plus ONLY the minimal 2-page dummy fixture in `content/networking/chapter1.json` (Page 1 `"panelType": "image"` + 2 dummy tokens; Page 2 `"panelType": "svg-scene"`, `"sceneModule": "ch1-demo-placeholder"`) and barebones `content/networking/scenes/ch1-demo-placeholder.js` (`mount`, `unmount`, optional `pause`/`resume`/`replay`, and a demo `context.openCodex` hotspot); verify via `python -m http.server 8000` in DevTools that `/content/networking/chapter1.json` parses cleanly and `/content/networking/scenes/ch1-demo-placeholder.js` exports the scene contract.

## 2. Read-Only Console Styling, Pluggable Stage & Router (`css/main.css`, `js/app.js`)

- [x] 2.1 (~165–200 LOC) Implement `css/main.css` defining `:root` `--sr-*` editorial dark-mode tokens, obsidian/slate surfaces, typography, masthead Archive Switcher dropdown/panel, Chapter Cover Card, crisp `16:9` panel stage with motion-safe transitions, non-obstructive bottom dialogue tray, tactile audio/pagination bar, and `<= 680px` mobile layout; verify via `python -m http.server 8000` in desktop (`1280x800`) and mobile (`390x844`) viewports that the 16:9 stage, switcher, and bottom tray never overlap or overflow.
- [x] 2.2 (~175–200 LOC) Implement `js/app.js` to load `content/manifest.json`, render branding and the Masthead Archive Switcher, sync/clamp `#<volume>/<chapter>/<page>` URL hashes, gate entry via `Start Chapter`, run the ~25-LOC non-blocking `[Cartridge Check]` validator, handle `Prev` / `Next` / `Next Chapter →` handoff and `ArrowLeft`/`ArrowRight` keys, and host the 16:9 stage (`<img>` + SVG blueprint fallback for `"image"`, or `unmount()` → `data-scene` scoping → dynamic `import()` from `../content/<vol>/scenes/` → `mount(stageEl, context)` for `"svg-scene"`); verify via `python -m http.server 8000` that Page 1 shows the SVG fallback, Page 2 mounts/unmounts `ch1-demo-placeholder.js`, `#networking/ch1/2` survives refresh, and `[Cartridge Check]` passes cleanly.

## 3. Read-Only Console Audio & Preloader (`js/audio.js`)

- [x] 3.1 (~140–185 LOC) Implement `js/audio.js` and wire it into `js/app.js`'s page-render fan-out to unlock HTML5 `<audio>` on `Start Chapter`, bind `assets/audio/net-ch1-p<00>.mp3`, drive Play/Pause, Replay (`0:00`), and timeline scrubbing, forward pause/resume/replay events to active `svg-scene` optional hooks, reset cleanly on page turns, display `"Audio not yet loaded"` when `.mp3` files are absent, and silently preload `page + 1`'s panel/scene and `.mp3`; verify via `python -m http.server 8000` across Pages 1–2 with missing `.mp3` files (confirming `"Audio not yet loaded"`, `page + 1` preload, Replay hook forwarding, and zero console errors) and with a temporary test `.mp3`.

## 4. Read-Only Console Token Parser & Active Codex (`js/parser.js`, `js/codex.js`, `css/codex.css`)

- [x] 4.1 (~160–200 LOC) Implement `js/parser.js` (XSS-safe `[[Display Term|term-id]]` button tokenizer), `js/codex.js`, and `css/codex.css` (wired into `js/app.js` and `js/audio.js`) so clicking an inline term, an SVG scene hotspot (`context.openCodex(termId)`), or `Chapter Glossary` pauses `audio.js` and any active scene `pause()` hook (remembering playback state), opens `<dialog id="codex-drawer">` with `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`, suppresses background arrow-key turns while open, and closes via `Escape`, close button, or backdrop click; verify via `python -m http.server 8000` by inspecting Page 1 inline tokens, clicking Page 2's scene hotspot, toggling `Chapter Glossary`, and confirming pause/resume coordination.
- [x] 4.2 (Integration check) Perform an end-to-end desktop/mobile browser, Console-vs-Cartridge boundary, and Cloudflare Pages static-path audit across Archive Switcher, Cover Card, Page 1 (`"image"` fallback + `parser.js` tokens), Page 2 (`"svg-scene"` `mount`/`unmount`/`replay`/`openCodex`), `#networking/ch1/2` deep-linking, `[Cartridge Check]` diagnostics, and DevTools Console; verify via `python -m http.server 8000` that adding new cartridges requires zero edits to `index.html`, `css/`, or `js/` and zero console errors occur.

## Workflow follow-up

- Hand off `openspec/changes/init-stackrewind-core/` for vertical-slice implementation (`openspec apply`).
- Archive `init-stackrewind-core` once Tasks `1.1`–`4.2` are implemented and verified, leaving `content/` and `assets/` ready for Codex chapter authoring.
