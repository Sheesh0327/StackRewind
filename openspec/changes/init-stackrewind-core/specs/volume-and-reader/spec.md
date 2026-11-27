# Spec Delta

## Purpose

Loads centralized brand and multi-volume catalog metadata from `content/manifest.json`, provides cartridge switching and autoplay-safe entry, synchronizes URL hashes, and hosts the pluggable 16:9 stage (`image` and sandboxed `svg-scene` cartridges) with preloading and runtime diagnostics.

## ADDED Requirements

### Requirement: Centralized Brand and Multi-Volume Manifest
The Console SHALL load centralized site branding (`name`, `tagline`) and volume/chapter catalog metadata from `content/manifest.json` at startup, rendering brand copy dynamically and supporting multiple computing volumes (`Networking`, plus planned `Operating Systems` and `Cybersecurity` entries).

#### Scenario: Manifest populates brand header and default chapter
- **GIVEN** `content/manifest.json` defines **StackRewind**, its tagline, and `Volume 1: Networking` (`ch1`)
- **WHEN** the web application initializes at the root URL
- **THEN** the UI renders the brand title and tagline from `content/manifest.json` and loads `content/networking/chapter1.json`

#### Scenario: Planned volumes render as upcoming entries
- **GIVEN** `content/manifest.json` lists `Operating Systems` and `Cybersecurity` with `"status": "coming-soon"`
- **WHEN** the user opens the Archive Switcher
- **THEN** unpublished volumes appear clearly labeled and dimmed as upcoming without selectable broken routes

### Requirement: Archive Switcher and Next-Chapter Handoff
The Console masthead SHALL render an Archive Switcher driven by `content/manifest.json` for switching published chapters, and on a chapter's final page (`Page N / N`) the primary forward control MUST present a `"Next Chapter →"` handoff whenever a subsequent published chapter exists in the volume.

#### Scenario: Selecting a published chapter in the Archive Switcher
- **GIVEN** `content/manifest.json` registers one or more published chapters
- **WHEN** the user selects a published chapter from the masthead Archive Switcher
- **THEN** the Console routes to `#<volume>/<chapter>/1` and displays that chapter's Cover Card

#### Scenario: Final page adapts to subsequent chapter availability
- **GIVEN** the user reaches Page `N` of `N` in the active chapter
- **WHEN** `content/manifest.json` lists a subsequent published chapter in the same volume
- **THEN** activating `"Next Chapter →"` routes to the next chapter; and **WHEN** no next chapter exists, forward page navigation past Page `N` is disabled

### Requirement: Chapter Cover Card Entry Gate
Before entering the comic reader stage in a fresh browser session, the system MUST present an editorial Chapter Cover Card displaying the volume badge, chapter title, historical era/subtitle, and a prominent `Start Chapter` button whose click gesture unlocks session audio autoplay.

#### Scenario: Fresh load displays Chapter Cover Card
- **GIVEN** a user opens StackRewind in a fresh tab
- **WHEN** the active chapter JSON finishes loading
- **THEN** the Chapter Cover Card is visible with the volume/chapter metadata and `Start Chapter` button prior to rendering active audio playback

#### Scenario: Clicking Start Chapter enters stage and unlocks autoplay
- **GIVEN** the Chapter Cover Card is displayed
- **WHEN** the user activates the `Start Chapter` button
- **THEN** the Cover Card transitions out, the comic stage opens on the target page (Page 1 by default, or the routed hash page), and session voiceover autoplay is unlocked

### Requirement: URL Hash State Synchronization
The system SHALL synchronize the active volume ID, chapter ID, and 1-based page number with `window.location.hash` formatted as `#<volume>/<chapter>/<page>` (for example, `#networking/ch1/2`).

#### Scenario: Advancing or reversing pages updates URL hash
- **GIVEN** the user is viewing `networking`, chapter `ch1`, Page 1
- **WHEN** the user navigates to Page 2
- **THEN** `window.location.hash` updates to `#networking/ch1/2`

#### Scenario: Refresh or direct link restores exact page
- **GIVEN** a user loads or refreshes the browser with `#networking/ch1/2`
- **WHEN** the manifest and chapter finish loading and the Cover Card gate is cleared
- **THEN** the reader opens directly on Page 2 of `networking/ch1`

#### Scenario: Out-of-bounds or malformed hash recovers gracefully
- **GIVEN** a user visits `#networking/ch1/99` or `#unknown/route`
- **WHEN** the router resolves the hash against `content/manifest.json` and the active chapter's page count
- **THEN** the system clamps or falls back to a valid volume, chapter, and page (`1`–`N`) and rewrites the normalized hash without runtime errors

### Requirement: Comic Panel Stage and Page Navigation
The system MUST render a crisp 16:9 panel frame, speaker nameplate, non-obstructive dialogue tray anchored below the artwork, `Page X / Y` indicator, and `Prev` / `Next` controls operable via pointer clicks and `ArrowLeft` / `ArrowRight` keys across desktop and mobile viewports.

#### Scenario: Stage displays artwork frame and anchored dialogue without overlap
- **GIVEN** an active chapter page is rendered on desktop or mobile
- **WHEN** the user views the comic stage
- **THEN** the panel maintains a 16:9 aspect ratio and the speaker nameplate and dialogue tray appear cleanly below the panel without covering artwork

#### Scenario: Button and keyboard pagination enforce chapter bounds
- **GIVEN** the Codex Drawer is closed and Page 1 of `N` is active
- **WHEN** the user presses `ArrowRight` or clicks `Next`
- **THEN** the stage transitions to Page 2 (`Page 2 / N`); and **WHEN** on Page 1, `Prev` and `ArrowLeft` do not navigate below Page 1

### Requirement: Pluggable Stage Panel Modes (Image and SVG Scene)
Each page object SHALL declare `"panelType"` as `"image"` or `"svg-scene"`. For `"image"`, the stage MUST render the `.webp` panel (or its SVG fallback). For `"svg-scene"`, the stage MUST dynamically import `content/<volume>/scenes/<sceneModule>.js`, call `mount(stageEl, context)` on entry, and call `unmount()` before leaving the page.

#### Scenario: SVG scene page mounts on entry and unmounts on page turn
- **GIVEN** Page 2 declares `"panelType": "svg-scene"` and `"sceneModule": "ch1-demo-placeholder"`
- **WHEN** the user navigates onto Page 2 and then navigates back to Page 1
- **THEN** the Console dynamically imports `content/networking/scenes/ch1-demo-placeholder.js`, calls `mount(stageEl, context)` on Page 2 entry, and calls `unmount()` before mounting Page 1

#### Scenario: Failing SVG scene module falls back gracefully
- **GIVEN** a page declares `"panelType": "svg-scene"` referencing a missing or throwing module
- **WHEN** the reader navigates to that page
- **THEN** the 16:9 stage renders the styled SVG placeholder fallback without breaking page navigation

### Requirement: Progressive SVG Scene Hooks, Hotspots, and CSS Sandboxing
When mounting an `"svg-scene"` module, the Console MUST set `data-scene="<sceneModule>"` on `stageEl`, expose read-only `--sr-*` CSS custom properties, pass `context` with `{ page, chapter, reducedMotion, openCodex(termId) }`, and invoke optional `pause()`, `resume()`, and `replay()` exports on Audio/Codex pause, resume, and replay.

#### Scenario: Optional scene hooks coordinate with audio and Replay controls
- **GIVEN** an active `"svg-scene"` exports `pause`, `resume`, and `replay` functions
- **WHEN** the user pauses audio (or opens the Codex Drawer), resumes playback, or clicks `Replay`
- **THEN** the Console invokes the scene's `pause()`, `resume()`, and `replay()` hooks respectively and clears `data-scene` on `unmount()`

#### Scenario: SVG scene hotspot opens Codex Drawer via context callback
- **GIVEN** an active `"svg-scene"` calls `context.openCodex("dummy-alpha")` on user click
- **WHEN** the hotspot is activated
- **THEN** the Console pauses active narration/scene playback and opens the Codex Drawer for `"dummy-alpha"`

### Requirement: Atmospheric SVG Panel Placeholder
When a page with `"panelType": "image"` has a missing or failing panel image (`assets/panels/<vol>-ch<num>-p<00>.webp`), the system MUST render a styled 16:9 editorial SVG placeholder displaying the zero-padded scene/page number, page title, and visual framing notes (`sceneNotes`).

#### Scenario: Missing WebP file renders styled SVG blueprint fallback
- **GIVEN** Page 1 uses `"panelType": "image"` and `assets/panels/net-ch1-p01.webp` is absent
- **WHEN** Page 1 renders on the comic stage
- **THEN** a 16:9 dark-mode archival SVG placeholder renders showing the scene number (`01`), the page title, and its visual framing notes with no broken-image icon

### Requirement: Next-Page Background Preloading
Whenever page `N` renders and page `N + 1` exists in the active chapter, the system SHALL preload page `N + 1`'s `.mp3` voiceover and its stage resource (`.webp` image for `"image"` pages, or ES6 module from `content/<volume>/scenes/` for `"svg-scene"` pages) in the background without surfacing errors if assets are missing.

#### Scenario: Viewing Page N triggers silent preload of Page N+1
- **GIVEN** the user views Page 1 of a multi-page chapter
- **WHEN** Page 1 finishes rendering
- **THEN** the client initiates background preload requests for Page 2's audio and stage resource (`.webp` or `content/<volume>/scenes/` module), and performs no preload on the final page

### Requirement: Non-Blocking Runtime Cartridge Diagnostics
On chapter load and scene mount, the Console SHALL run a non-blocking `[Cartridge Check]` pass that logs DevTools warnings for missing required chapter fields, unresolved `[[Term|id]]` codex IDs, or missing `mount`/`unmount` scene exports without interrupting reader rendering.

#### Scenario: Unresolved token or malformed scene logs warning without UI crash
- **GIVEN** a loaded chapter references an undefined codex ID or an `"svg-scene"` omits `unmount`
- **WHEN** the Console validates the cartridge
- **THEN** a `[Cartridge Check]` warning is logged to the DevTools Console while the reader UI remains interactive
