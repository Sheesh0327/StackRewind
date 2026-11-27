# Spec Delta

## Purpose

Allows StackRewind readers to follow their system color scheme by default or toggle cleanly between high-contrast Light and Dark themes without flash of un-themed content or edits to content cartridges.

## ADDED Requirements

### Requirement: System-Default Color Scheme and FOUC Prevention
The system SHALL default to the user's OS color-scheme preference (`light dark`) when no manual override is stored, and SHALL apply any persisted theme preference synchronously before first paint without throwing when storage is restricted.

#### Scenario: Fresh visit follows OS color scheme
- **GIVEN** no theme preference is stored in browser storage
- **WHEN** the user loads StackRewind on an OS set to light mode or dark mode
- **THEN** the page, native browser controls, and reader surfaces render in the matching light or dark theme automatically

#### Scenario: Reload preserves persisted override without flash
- **GIVEN** the user has selected an explicit light or dark theme override
- **WHEN** the user reloads or navigates directly to a hashed chapter URL
- **THEN** the stored scheme is applied before initial paint so the previous scheme does not flash

#### Scenario: Restricted storage degrades gracefully
- **GIVEN** browser storage access throws a security or quota error
- **WHEN** the page loads or the user toggles the theme
- **THEN** the theme switches cleanly in the active tab without uncaught console errors

### Requirement: Two-State Masthead Theme Toggle and System Reversion
The Console masthead SHALL provide an accessible two-state theme toggle button that switches to the opposite rendered scheme, persists explicit overrides only when diverging from the OS setting, and removes the override to resume OS-following when toggled back to match the OS.

#### Scenario: Toggling away from OS preference persists literal override
- **GIVEN** the OS is set to dark mode and no override is stored
- **WHEN** the user activates the masthead theme toggle
- **THEN** the UI switches to Light mode, stores `"light"` as the user override, and updates the button's accessible label to offer switching back to Dark mode

#### Scenario: Toggling back to match OS reverts to system-following
- **GIVEN** the OS is set to dark mode and `"light"` is stored as the override
- **WHEN** the user activates the masthead theme toggle
- **THEN** the UI switches to Dark mode, clears the stored override so future OS theme changes apply automatically, and updates the button's accessible label to offer switching to Light mode

#### Scenario: OS schedule changes do not erase an explicit override
- **GIVEN** the OS was light mode and the user explicitly toggled to Dark mode (`"dark"` stored)
- **WHEN** the OS later switches to dark mode and subsequently back to light mode
- **THEN** StackRewind preserves the `"dark"` override and stays in Dark mode until the user manually toggles back

### Requirement: Cross-Tab Theme Synchronization
When the user changes the theme override in one StackRewind tab, any other open StackRewind tab SHALL update its rendered theme automatically.

#### Scenario: Theme change in another tab syncs immediately
- **GIVEN** two StackRewind tabs are open in the same browser origin
- **WHEN** the user toggles the theme in Tab A
- **THEN** Tab B updates its color scheme and toggle button state immediately without requiring a page reload

### Requirement: Dual-Scheme Visual Tokens and Cartridge Inheritance
All Console surfaces (masthead, Archive Switcher, Chapter Cover Card, 16:9 stage frame, dialogue tray, text-only inline Codex terms, archival control bar, and Codex Drawer) and shared `--sr-*` CSS custom properties consumed by Cartridge SVG scenes SHALL maintain legible WCAG AA contrast in both Light and Dark themes, including progressive fallbacks for browsers lacking `light-dark()`.

#### Scenario: Light and Dark themes style Console and SVG scenes without Cartridge edits
- **GIVEN** an existing chapter cartridge with Page 1 blueprint fallback and Page 2 vector scene
- **WHEN** the reader switches between Light and Dark themes
- **THEN** Console cards, text-only Codex highlights, the Codex Drawer, and Cartridge SVG scenes update seamlessly with zero modifications to `content/` or `assets/`

### Requirement: Responsive Masthead Integration
The masthead theme toggle MUST integrate into desktop (`1280×800`) and mobile (`390×844`) viewports without colliding with the brand title, Archive Switcher, or `Chapter Glossary` control or causing horizontal overflow.

#### Scenario: Mobile masthead wraps cleanly with theme toggle
- **GIVEN** the user opens StackRewind at a `390×844` mobile viewport
- **WHEN** inspecting the masthead controls in Light or Dark mode
- **THEN** all masthead controls fit within `390px` with zero horizontal overflow or overlapping labels
