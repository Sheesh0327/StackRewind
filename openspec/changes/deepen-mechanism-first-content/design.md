# Design

## Context

See `proposal.md` for motivation. StackRewind's two-layer UI naturally separates fast narrative flow (**Dialogue Tray + 16:9 SVG Animation**) from deeper reference inspection (**Active Codex Drawer**). Currently, Chapter 1's pages average `~40` words and mention ideas ("hot-potato routing", "queueing theory", "packet") without explaining the mechanical *how*, while `hot-potato-routing` sits in `codex` unlinked from Page 4's dialogue.

## Goals / Non-Goals

**Goals:**
- Define a concrete **Dialogue Tray vs. Codex Drawer** division of depth so main narration explains *how* each mechanism solves its problem (`60–95` words/page) while the Codex Drawer holds deeper multi-sentence mechanics (`plainEnglish`, `whyItWasInvented`, `realWorldSighting`).
- Enforce density bounds (`30–130` words/page; `>= 10` words per `codex` field) deterministically in `scripts/validate-cartridge.mjs`.
- Deepen `content/networking/chapter1.json`, sync `content/networking/tts/net-ch1-tts.json`, and regenerate `assets/audio/net-ch1-p01..06.mp3`.

**Non-Goals:**
- Modifying Console UI (`index.html`, `css/`, `js/`) or Chapter 1 SVG animation modules (`content/networking/scenes/*.js`).
- Turning pages into textbook essays (`> 130` words) that crowd mobile viewports or drag voiceover pacing beyond ~30–40 seconds per page.

## Decisions

### 1. Editorial Division of Labor (Dialogue Tray vs. Codex Drawer)
- **Page `dialogue` / `tts` (`60–95` words target, ~22–38s spoken)**:
  - **Sentence 1 (Problem/Context)**: Name the concrete failure or constraint visible in the 16:9 SVG scene.
  - **Sentence 2–3 (Exact Mechanism)**: Explain step-by-step *how* the design works (inputs, state/headers, routing/queueing rule, output).
  - **Sentence 4 (Result / Trade-off)**: State what improved and what new bottleneck or limit emerged next.
  - **Anti-Bloat Rules**: No generic hype ("changed the world forever"), no biographical trivia unrelated to the mechanism, and no redundant repetition of what the `codex` drawer already unpacks.
- **Active `codex` Entry (deep-dive on click)**:
  - `plainEnglish` (2–3 sentences): Exact operational mechanics (fields, buffers, forwarding rules, or failure mode).
  - `whyItWasInvented` (2 sentences): Specific quantitative or physical bottleneck that forced its invention.
  - `realWorldSighting` (1–2 sentences): Concrete protocol, header, or tool engineers inspect today.

### 2. Networking Chapter 1 Mechanism Blueprint
1. **Page 1 (`net-ch1-p01`)**: Why a dead wire needs a [[Network Protocol|network-protocol]] — framing boundaries, sender/receiver synchronization, and error recovery rules before any single bit has meaning.
2. **Page 2 (`net-ch1-p02`)**: How the [[Analog Telephone Network|analog-telephone-network]] holds a dedicated continuous electrical path from dial to hang-up, and why computer traffic (millisecond bursts followed by seconds of silence) leaves ~99% of that reserved line idle.
3. **Page 3 (`net-ch1-p03`)**: How [[Circuit Switching|circuit-switching]] latches physical relays across every intermediate exchange — blocking third-party callers (`BUSY`) during silence and severing the entire call if a single relay drops.
4. **Page 4 (`net-ch1-p04`)**: How Baran's [[Distributed Mesh|distributed-mesh]] cuts messages into 1,024-bit [[Message Blocks|message-blocks]] stamped with destination headers, and uses [[Hot-Potato Routing|hot-potato-routing]] (each switch reads a tiny local hop table and hands the block immediately to its best surviving neighbor) so traffic flows around dead hubs with zero central map.
5. **Page 5 (`net-ch1-p05`)**: How Kleinrock's [[Queueing Theory|queueing-theory]] proves overlapping bursts can share one link when a short FIFO buffer absorbs simultaneous arrivals and drains them during idle gaps, and how Davies's [[Packet|packet]] attaches a compact routing header + payload chunk so switches interleave users turn by turn.
6. **Page 6 (`net-ch1-p06`)**: How [[ARPANET|arpanet]] isolated packet switching onto dedicated IMP minicomputers (linking UCLA, SRI, UCSB, and Utah despite the Oct 29 `"LO"` buffer crash), setting up the next bottleneck: what happens when multiple hosts share one physical wire and transmit at the same instant?

### 3. Automated Word-Count Bounds (`scripts/validate-cartridge.mjs`)
- Add `countWords(text)` helper that strips `[[Display|id]]` → `Display` before splitting on whitespace (`/\s+/`).
- Enforce:
  - `30 <= pageDialogueWords <= 130` and `30 <= pageTtsWords <= 130` (hard error outside bounds; prints advisory `[Cartridge Validator WARN]` if outside ideal `55–105` sweet spot? Keep `30–130` as hard error and optional note so existing/new chapters pass cleanly when well-written).
  - `codexFieldWords >= 10` for `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`.

## Risks / Trade-offs

- **[Longer dialogue wrapping awkwardly on 390×844 mobile]** → Target `60–95` words (~3–4 concise sentences), verified directly in desktop (`1280×800`) and mobile (`390×844`) viewports on `http://127.0.0.1:8000/`.
- **[Audio duration mismatch after dialogue rewrite]** → Re-run `node scripts/generate-tts.mjs --chapter content/networking/chapter1.json --overwrite` immediately after syncing `net-ch1-tts.json` so all 6 `.mp3` files match the exact new text.
