# Spec Delta

## Purpose

Provides per-page HTML5 voiceover narration with compact archival transport controls, deterministic resets across page turns, and error-free visual degradation when `.mp3` files are not yet present.

## ADDED Requirements

### Requirement: Per-Page Voiceover Playback and Archival Controls
The system SHALL integrate HTML5 `<audio>` mapped to `assets/audio/<vol>-ch<num>-p<00>.mp3` and render a compact archival player bar with Play/Pause toggle, Replay button, and interactive timeline progress scrubber.

#### Scenario: Available MP3 plays and updates archival scrubber
- **GIVEN** the user has passed the `Start Chapter` entry gate and `assets/audio/net-ch1-p01.mp3` exists
- **WHEN** Page 1 becomes active
- **THEN** the voiceover begins playing, the primary transport button reflects the active Pause state, and the progress scrubber tracks current playback time

#### Scenario: Replay and scrubber seek within active page audio
- **GIVEN** a valid `.mp3` voiceover is loaded for the active page
- **WHEN** the user clicks `Replay` or scrubs the progress bar to a new position
- **THEN** `Replay` restarts audio from `0:00` and scrubbing seeks playback to the chosen timestamp

### Requirement: Clean Audio Reset on Page Navigation
When the active page changes, the system MUST immediately halt any playing narration, reset playback time and progress UI to `0:00`, and load the incoming page's `.mp3` source so audio tracks never overlap.

#### Scenario: Turning the page stops previous narration cleanly
- **GIVEN** Page 1 voiceover is playing mid-track
- **WHEN** the user navigates to Page 2 via `Next`, `ArrowRight`, or URL hash change
- **THEN** Page 1 playback stops immediately, the scrubber resets to `0:00`, and Page 2's audio source initializes

### Requirement: Graceful Degradation When Audio Is Missing
When a page's `.mp3` voiceover file is missing or fails to load, the system MUST display a subtle `"Audio not yet loaded"` indicator in the player bar, disable Play/Pause, Replay, and scrubber controls cleanly, and produce zero uncaught console errors.

#### Scenario: Missing MP3 displays subtle unavailable state without errors
- **GIVEN** `assets/audio/net-ch1-p02.mp3` does not exist on the server
- **WHEN** the user navigates to Page 2
- **THEN** the archival audio bar displays `"Audio not yet loaded"`, transport controls render in a non-broken disabled state, and no unhandled promise rejections or JavaScript exceptions are logged
