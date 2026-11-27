---
name: design-svg-scene
description: Design, animate, and visually verify looping 960x540 dual-theme StackRewind SVG scene modules using looping-scene.js and --sr-* theme tokens without modifying Read-Only Console code.
---

# Design Looping Dual-Theme SVG Scene

Craft technical motion graphics that visually explain a concrete engineering mechanism on every frame without overlapping labels or theme regressions. Never edit Read-Only Console files (`index.html`, `css/`, `js/`).

## 1. Runtime Contract (`content/<volume>/scenes/<sceneModule>.js`)

- Copy `content/networking/scenes/looping-scene.js` into `content/<volume>/scenes/looping-scene.js` for new volumes and import `{ createLoopingScene, clamp, ease, lerp, windowPulse }` from `./looping-scene.js`.
- Pass `{ id, description, artwork, duration, draw }` to `createLoopingScene(...)` and export its 5 lifecycle methods:
  ```js
  const scene = createLoopingScene({ id, description, artwork, duration, draw });
  export const { mount, unmount, pause, resume, replay } = scene;
  ```
- Inspect `content/networking/scenes/net-ch1-p01.js` through `net-ch1-p06.js` for reference choreography.

## 2. Continuous Seamless Looping

- Scenes run on a continuous `requestAnimationFrame` cycle (`elapsedMs = (elapsedMs + dt) % durationMs`) that MUST keep animating regardless of OS reduced-motion settings.
- Engineer `draw(parts, t)` so the state at `t = duration` returns smoothly to `t = 0` (via `windowPulse`, phased fade-ins/fade-outs, or cyclic coordinates) with no jarring visual pop on wraparound.
- Mark dynamic SVG nodes with `data-part="<key>"` so `draw(parts, t)` mutates attributes cleanly (`transform`, `opacity`, `stroke-dashoffset`, `x2`, `width`, text status readouts) without rebuilding the DOM per frame.

## 3. Canvas Layout & Anti-Overlap Craft (`viewBox="0 0 960 540"`)

- Keep all primary artwork inside safe margins (`x: 36..924`, `y: 32..508`) so badges and borders never clip on narrow viewports.
- Establish clear left-to-right or cause-to-effect flow matching `page.sceneNotes` and `page.dialogue`.
- **Zero Overlapping Text**: Give titles, subtitles, counters, wires, and moving packets dedicated spatial lanes. Keep badges at least `12px` clear of adjacent labels and font sizes readable when scaled down to a `390×844` mobile screen.
- Prefix every custom `<style>` selector inside `artwork` with `[data-scene="<id>"]` so styles never leak across pages.

## 4. Dual-Theme Styling (`Warm Paper Noir` Dark + `Warm Paper` Light)

Use the Console's `--sr-*` CSS tokens and `looping-scene.js` helper variables rather than hardcoded dark-only or light-only hex colors:
- Surfaces & borders: `--sr-bg-canvas`, `--sr-bg-surface`, `--sr-bg-elevated`, `--sr-border`, `--sr-border-strong` (or built-in `.sc-card`, `.sc-panel`, `.sc-wire`, `.sc-amber-wire` classes).
- Typography & ink: `--sr-ink`, `--sr-ink-secondary`, `--sr-ink-muted`, `--sr-font-display`, `--sr-font-sans`, `--sr-font-mono` (or `.sc-title`, `.sc-mono`).
- Semantic accents provided by `looping-scene.js`:
  - `--sr-amber`, `--sr-amber-soft` (active energy, primary focus)
  - `--scene-teal`, `--scene-teal-soft` (healthy signal, routed packet, success)
  - `--scene-crimson`, `--scene-crimson-soft` (overload, collision, failure)
  - `--scene-paper-ink` (high-contrast text on solid accent fills)

## 5. Verification Checklist

- Confirm `chapter<N>.json` references `"sceneModule": "<id>"` matching the filename `<id>.js` and `createLoopingScene({ id: "<id>", ... })`.
- Preview the page over HTTP in **both** Dark and Light themes, capturing or observing distinct animation phases across `t` to prove elements move smoothly and remain crisp with zero clipping or text collision.
- Run `node scripts/validate-cartridge.mjs` and confirm exit `0`.
