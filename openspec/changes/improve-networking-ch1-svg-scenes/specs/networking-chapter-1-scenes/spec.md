# Spec Delta

## Purpose

Networking Chapter 1 uses interactive diagrams to explain circuit reservation, routing around a failed hub, and the queues that form when terminals share a link.

## ADDED Requirements

### Requirement: Three-exchange circuit reservation

Page 3 SHALL show an end-to-end circuit reserved through three exchanges, including during silence. The reader SHALL be able to fail and restore the middle exchange.

#### Scenario: The circuit stays reserved during silence

- **GIVEN** the circuit is connected and scene animation is running
- **WHEN** the demonstration enters its silent phase
- **THEN** the signal pulse stops and the complete route through all three exchanges remains visibly reserved

#### Scenario: The middle exchange interrupts the circuit

- **WHEN** the reader activates the failure control on page 3
- **THEN** the diagram marks the middle exchange as failed, shows the route as disconnected, and stops the signal
- **AND** restoring the exchange reconnects the reserved route and lets the demonstration continue

### Requirement: Mesh routing around a failed hub

Page 4 SHALL show a mesh with surviving routes that carry message blocks around the central hub when the reader disables it.

#### Scenario: Message blocks travel along surviving routes

- **WHEN** the reader disables the central hub on page 4
- **THEN** the diagram marks the hub as failed and shows message blocks on routes that bypass it
- **AND** restoring the hub makes routes through it available again

### Requirement: Two-terminal packet queue

Page 5 SHALL show two terminals sending packet bursts to a shared queue and link. The scene SHALL show packet source and queue contents as the link sends one packet per time slot in arrival order.

#### Scenario: Overlapping bursts build a queue and quiet slots drain it

- **WHEN** both terminals send during the same time slot
- **THEN** one packet uses the link and the remaining arrivals are visible in the waiting queue
- **AND** later time slots with no arrivals drain the queue and show packets from both terminals sharing the link

### Requirement: Motion and manual scene controls

Pages 3 through 5 SHALL keep their scene controls operable with a keyboard and in reduced-motion mode. The current scene SHALL respond to the reader's playback controls and release its animation and controls on page exit.

#### Scenario: Reduced motion keeps demonstrations readable and operable

- **GIVEN** the reader has enabled reduced motion
- **WHEN** the reader opens a scene and uses its controls with the keyboard
- **THEN** circuit and hub state changes and time-slot steps are visible without continuous animation

#### Scenario: Reader controls and page navigation govern the active scene

- **GIVEN** a scene is playing in the reader
- **WHEN** the reader pauses narration, resumes it, uses Replay, opens a Codex entry, or leaves and returns to the page
- **THEN** the scene pauses with narration or Codex, resumes with the applicable reader action, resets on Replay, and mounts only one fresh scene on reentry
