# Tasks

## 1. Circuit switching

- [x] 1.1 Update `content/networking/scenes/net-ch1-p03.js` to show a reserved route through three exchanges. In the reader, watch the pulse stop during silence and verify that the route stays highlighted.
- [x] 1.2 Wire the fault and restore control to the middle exchange. Verify by keyboard that the route opens, the signal stops, and restoring the exchange reconnects the route. Repeat with reduced motion enabled.

## 2. Shared link and queue

- [x] 2.1 Update `content/networking/scenes/net-ch1-p05.js` to display two terminals and derive the diagram from the arrival schedule in the design. Step through a cycle and verify that the link sends A, B, A, B while the visible waiting queue contains 1, 2, 1, and 0 packets.
- [x] 2.2 Verify the step control with a keyboard and reduced motion. Confirm every slot has a readable static state and that automated motion is disabled.

## 3. Published chapter verification

- [x] 3.1 Open `#networking/ch1/4` in the published reader, start the chapter, and verify that disabling the hub sends blocks around it and restoring it reopens the central routes. Check that both route states are legible in reduced motion.
- [x] 3.2 Navigate through pages 3–5 and back at desktop and narrow mobile widths. Verify that each diagram mounts in the 16:9 stage with visible controls, reentry resets the scene, and rapid navigation leaves only the active scene without scene-load warnings.
- [x] 3.3 On pages 3–5, use the reader's narration Pause, Play, and Replay controls and open and close a dialogue Codex entry. Verify that the scene pauses, resumes when the reader resumes playback, resets on Replay, and stays paused while the drawer is open.
