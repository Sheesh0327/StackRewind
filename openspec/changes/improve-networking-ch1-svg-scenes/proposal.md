# Proposal

## Why

Two diagrams in Networking Chapter 1 differ from their scene notes. The circuit runs through one switchboard, and the shared-link diagram shows three terminals. Bringing the diagrams into line with the chapter makes the contrast between reserved circuits and shared links easier to follow.

## What Changes

- Show the reserved circuit crossing three exchanges on page 3. Keep the reservation visible during silence and let the reader simulate and restore a failure at the middle exchange.
- Show two terminals feeding one queue and link on page 5. Use overlapping bursts to show the queue build and then drain as packets from both terminals share the link.
- Verify pages 3 through 5 in the published chapter, including page 4's existing rerouting demonstration and each scene's controls and playback lifecycle.

## Capabilities

### New Capabilities

- `networking-chapter-1-scenes` covers the interactive circuit, mesh, and queueing demonstrations in the published chapter.

### Modified Capabilities

## Impact

Implementation is scoped to `content/networking/scenes/net-ch1-p03.js` and `content/networking/scenes/net-ch1-p05.js`. The browser checks use the published cartridge and its existing reader, narration, and Codex controls.
