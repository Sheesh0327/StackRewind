# Design

## Context

The manifest loads the published chapter from `data/networking/chapter1.json`. Its SVG panels resolve to `content/networking/scenes/` and receive the reader's scene context, including the reduced-motion preference. Each module owns its SVG, controls, and animation frame loop for the current mount.

## Goals / Non-Goals

Use the existing 16:9 stage, theme variables, native controls, and scene lifecycle. The two scene modules own the diagram changes. The published chapter, narration, and page 4 module provide the inputs for browser verification.

## Decisions

- **Page 3 uses one route with three labeled exchanges.** Place the exchanges in order between the two end terminals and draw the reservation separately from the signal pulse. The existing failure control opens the middle exchange and updates the path and status together. Separate reservation and signal states make the silent interval legible. In reduced motion, show the reservation statically and let the reader toggle the fault.
- **Page 5 drives the diagram from one arrival schedule.** Use two slots with one arrival from each terminal, followed by two slots with no arrivals. Use A then B as the example's within-slot arrival order. The link transmits A, B, A, B and the waiting queue after each transmission starts has 1, 2, 1, and 0 packets. Derive the displayed arrivals, queue, and transmitted source from that same schedule. Use the same slot rendering for animation, keyboard stepping, and reduced motion.
- **Keep the scene lifecycle local to each module.** Reuse the existing pause, resume, replay, and cleanup hooks. Verify the three modules via the published reader, including the page 4 hub toggle and the reader's existing Codex and narration behavior.

## Risks / Trade-offs

- The three exchange labels and the queue display share a fixed stage with their controls. Check legibility and control placement at desktop and narrow mobile widths.
- Page 5's queue count represents packets still waiting after one packet enters the link. Present the in-flight packet separately so readers can account for every arrival.
