# Proposal

## Why

Computing fundamentals are often taught as dry, memorized specifications detached from the real-world engineering failures that forced them into existence. **StackRewind** (*"Rewind the stack to the problem that created it."*) solves this with a zero-dependency, editorial dark-mode graphic novel web reader built around a strict **Console & Cartridge** separation—starting with the read-only Console engine and a minimal `Volume 1: Networking, Chapter 1` dummy test cartridge.

## What Changes

- **Strict Console vs. Cartridge Architecture**: Isolate the immutable Console (`index.html`, `css/{main,codex}.css`, `js/{app,parser,audio,codex}.js`) from writable Content Cartridges (`content/` and flat `assets/{panels,audio}/`) so future chapters and volumes drop in with zero Console code edits.
- **Centralized Manifest & Archive Switcher**: Add `content/manifest.json` storing **StackRewind** branding and a multi-volume catalog (`Networking`, plus `coming-soon` slots for `Operating Systems` and `Cybersecurity`), powering a masthead Archive Switcher and automatic final-page `Next Chapter →` handoff.
- **Pluggable Editorial Dark-Mode Stage**: Build a responsive 16:9 comic stage (`--sr-*` theme tokens, Chapter Cover Card autoplay gate, `#<vol>/<ch>/<page>` hash routing, `page + 1` preloading, and `[Cartridge Check]` DevTools diagnostics) supporting `"panelType": "image"` (with styled SVG blueprint fallbacks) and `"panelType": "svg-scene"` (dynamically importing `content/<vol>/scenes/ch<N>-<scene>.js` with `mount`/`unmount`, optional `pause`/`resume`/`replay`, `[data-scene]` CSS scoping, and `context.openCodex(termId)`).
- **Archival Voiceover Player**: Integrate HTML5 `<audio>` narration (`assets/audio/<vol>-ch<num>-p<00>.mp3`) with Play/Pause, Replay, and scrubber controls that coordinate with active SVG scenes, reset cleanly across page turns, and degrade silently when `.mp3` files are absent.
- **Active Codex & Self-Contained Glossary**: Parse inline `[[Display Term|term-id]]` dialogue tokens (and SVG scene `openCodex` hotspots) to auto-pause audio/scenes and open a slide-over `<dialog>` Codex Drawer and Chapter Glossary backed by each chapter's self-contained `codex`.
- **Dummy Cartridge Fixture & Codex Handoff Spec**: Author `content/README.md` documenting the Cartridge contract alongside a minimal 2-page dummy fixture (`content/networking/chapter1.json` + `content/networking/scenes/ch1-demo-placeholder.js`), leaving real story prose, glossary copy, and vector animations empty for dedicated cartridge authoring.

## Capabilities

### New Capabilities

- `volume-and-reader`: Manifest loading, masthead Archive Switcher, `Next Chapter →` handoff, Cover Card autoplay gate, `#<vol>/<ch>/<page>` hash routing, pluggable 16:9 `"image" | "svg-scene"` stage (with progressive hooks, `--sr-*` tokens, `[data-scene]` sandboxing, and `[Cartridge Check]` diagnostics), SVG fallbacks, and `page + 1` preloading.
- `audio-narration`: Per-page HTML5 `<audio>` voiceover playback, compact archival transport controls (Play/Pause, Replay, scrubber), page-turn lifecycle resets, and silent fallback UI when `.mp3` assets are unavailable.
- `active-codex`: Inline `[[Display Term|term-id]]` token parsing and `context.openCodex(termId)` support, audio/scene auto-pause coordination, slide-over `<dialog>` Codex Drawer (`plainEnglish`, `whyItWasInvented`, `realWorldSighting`), keyboard/backdrop dismissal, and Chapter Glossary mode.
- `chapter-1-skeleton`: Self-contained chapter JSON contract, standalone `content/README.md` Cartridge authoring guide, and minimal 2-page dummy test fixture (`content/networking/chapter1.json` + `content/networking/scenes/ch1-demo-placeholder.js`).

### Modified Capabilities

<!-- None — greenfield project -->

## Impact

- **Planned Workspace Layout**: Read-only Console (`index.html`, `css/{main,codex}.css`, `js/{app,parser,audio,codex}.js`) + Writable Cartridges (`content/README.md`, `content/manifest.json`, `content/<vol>/chapter<N>.json`, `content/<vol>/scenes/`, `assets/panels/`, `assets/audio/`).
- **Runtime & Dependencies**: Vanilla HTML5, CSS3, ES6 modules (`type="module"`), and static JSON. Zero frameworks, bundlers, npm packages, or backend services.
- **Deployment & Media Conventions**: Zero-build static hosting compatible with Cloudflare Pages; flat predictable media drops at `assets/panels/<vol>-ch<num>-p<00>.webp` and `assets/audio/<vol>-ch<num>-p<00>.mp3`.
- **Out of Scope**: Real networking history prose/glossary copy, production `.webp`/`.mp3` binary media, production vector animations, Volumes 2–3 cartridges, and server-side state.
