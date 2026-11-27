import { createLoopingScene, ease, lerp } from "./looping-scene.js";

// 6 time slots * 1.5s = 9.0s seamless cycle
const slots = [
  { send: "A", queue: ["B"], arrival: "BURST: A + B", depth: 1 },
  { send: "B", queue: ["A", "B"], arrival: "BURST: A + B", depth: 2 },
  { send: "A", queue: ["B", "A"], arrival: "ARRIVAL: A", depth: 2 },
  { send: "B", queue: ["A"], arrival: "QUIET SLOT", depth: 1 },
  { send: "A", queue: [], arrival: "QUIET SLOT", depth: 0 },
  { send: null, queue: [], arrival: "LINK IDLE", depth: 0 },
];

const queueBoxes = [0, 1, 2, 3].map((idx) => {
  const x = 468 - idx * 50;
  return `<g transform="translate(${x} 218)">
    <rect width="38" height="44" rx="6" class="sc-panel"/>
    <rect data-part="qFill${idx}" x="3" y="3" width="32" height="38" rx="4" fill="var(--sr-amber)" opacity="0"/>
    <text data-part="qTxt${idx}" x="19" y="27" text-anchor="middle" class="sc-mono" font-size="14" font-weight="700" fill="var(--scene-paper-ink)" opacity="0"></text>
  </g>`;
}).join("");

const artwork = `
  <defs>
    <pattern id="p05-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#p05-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1961–1966 · KLEINROCK &amp; DAVIES</text>
  <text x="48" y="88" class="sc-title" font-size="30">Sharing one link through a queue</text>

  <!-- Arrival & Queue Connectors -->
  <path d="M188 184 H244 L276 240 H298" class="sc-wire"/>
  <path d="M188 300 H244 L276 240 H298" class="sc-wire"/>
  <path d="M524 240 H906" class="sc-wire"/>
  <path d="M892 230 L908 240 L892 250" fill="none" stroke="var(--sr-border-strong)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Terminal A & B Cards -->
  <g transform="translate(48 144)">
    <rect width="142" height="78" rx="10" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--sr-amber)"/>
    <text x="36" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">TERMINAL A</text>
    <text data-part="aState" x="22" y="56" class="sc-mono" font-size="11" fill="var(--sr-amber)">BURSTING</text>
  </g>
  <g transform="translate(48 260)">
    <rect width="142" height="78" rx="10" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--scene-teal)"/>
    <text x="36" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">TERMINAL B</text>
    <text data-part="bState" x="22" y="56" class="sc-mono" font-size="11" fill="var(--scene-teal)">BURSTING</text>
  </g>

  <!-- Central FIFO Queue Buffer -->
  <g transform="translate(292 166)">
    <rect width="232" height="148" rx="12" class="sc-card"/>
    <text x="16" y="26" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">FIFO QUEUE</text>
    <text data-part="qDepth" x="216" y="26" text-anchor="end" class="sc-mono" font-size="11" fill="var(--sr-amber)">1 WAITING</text>
  </g>
  ${queueBoxes}
  <!-- Queue Depth Meter -->
  <g transform="translate(310 282)">
    <rect width="196" height="8" rx="4" class="sc-panel"/>
    <rect data-part="depthBar" width="49" height="8" rx="4" fill="var(--sr-amber)"/>
  </g>

  <!-- Shared Link Labels -->
  <text x="548" y="210" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">SHARED LINK · ONE PACKET PER TURN</text>
  <text data-part="slotLabel" x="908" y="210" text-anchor="end" class="sc-mono" font-size="11" fill="var(--sr-amber)">SLOT 1 / 6</text>

  <!-- Incoming Burst Particles -->
  <g data-part="inA" opacity="0">
    <rect x="-14" y="-12" width="28" height="24" rx="4" fill="var(--sr-amber)"/>
    <text y="5" text-anchor="middle" class="sc-mono" font-size="12" font-weight="700" fill="var(--scene-paper-ink)">A</text>
  </g>
  <g data-part="inB" opacity="0">
    <rect x="-14" y="-12" width="28" height="24" rx="4" fill="var(--scene-teal)"/>
    <text y="5" text-anchor="middle" class="sc-mono" font-size="12" font-weight="700" fill="var(--scene-paper-ink)">B</text>
  </g>

  <!-- Transmitting Packet on Shared Link -->
  <g data-part="linkPkt" opacity="0">
    <rect x="-36" y="-18" width="72" height="36" rx="6" fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
    <line x1="-12" y1="-16" x2="-12" y2="16" stroke="var(--scene-paper-ink)" stroke-width="1.5" opacity="0.5"/>
    <text x="-24" y="4" text-anchor="middle" class="sc-mono" font-size="9" font-weight="700" fill="var(--scene-paper-ink)">HDR</text>
    <text data-part="linkTxt" x="12" y="5" text-anchor="middle" class="sc-mono" font-size="14" font-weight="700" fill="var(--scene-paper-ink)">A</text>
  </g>

  <!-- Bottom Packet Anatomy & Slot Bar -->
  <g transform="translate(48 386)">
    <rect width="424" height="106" rx="12" class="sc-card"/>
    <text x="20" y="28" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">ARRIVAL PATTERN (OVERLAPPING BURSTS)</text>
    <text data-part="arrivalText" x="20" y="58" class="sc-title" font-size="22">BURST: A + B</text>
    <text x="20" y="84" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">Gaps allow the backlog to drain cleanly</text>
  </g>

  <g transform="translate(492 386)">
    <rect width="420" height="106" rx="12" class="sc-card"/>
    <text x="20" y="28" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">PACKET ANATOMY (DAVIES, 1966)</text>
    <rect x="20" y="44" width="124" height="42" rx="6" class="sc-panel" stroke="var(--sr-amber)"/>
    <rect x="150" y="44" width="250" height="42" rx="6" class="sc-panel"/>
    <text x="82" y="69" text-anchor="middle" class="sc-mono" font-size="12" fill="var(--sr-amber)">HEADER</text>
    <text x="275" y="69" text-anchor="middle" class="sc-mono" font-size="12" fill="var(--sr-ink)">PAYLOAD CHUNK</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch1-p05",
  description: "Terminals A and B send overlapping bursts into a FIFO queue. The shared link transmits one interleaved packet per slot while the backlog builds and drains.",
  artwork,
  duration: 9.0,
  still: 3.1,
  draw(parts, time) {
    const period = 1.5;
    const idx = Math.min(slots.length - 1, Math.floor(time / period));
    const local = (time % period) / period;
    const slot = slots[idx];

    const slotLabel = `SLOT ${idx + 1} / ${slots.length}`;
    if (parts.slotLabel.textContent !== slotLabel) parts.slotLabel.textContent = slotLabel;
    if (parts.arrivalText.textContent !== slot.arrival) parts.arrivalText.textContent = slot.arrival;

    const qText = `${slot.depth} WAITING`;
    if (parts.qDepth.textContent !== qText) parts.qDepth.textContent = qText;
    parts.depthBar.setAttribute("width", String(Math.max(8, (slot.depth / 4) * 196)));

    // Render queued packets in FIFO buffer slots
    for (let i = 0; i < 4; i++) {
      const fill = parts[`qFill${i}`];
      const txt = parts[`qTxt${i}`];
      const item = slot.queue[i];
      if (item) {
        fill.setAttribute("opacity", "1");
        fill.setAttribute("fill", item === "A" ? "var(--sr-amber)" : "var(--scene-teal)");
        txt.setAttribute("opacity", "1");
        txt.textContent = item;
      } else {
        fill.setAttribute("opacity", "0");
        txt.setAttribute("opacity", "0");
      }
    }

    // Incoming terminal indicators & flying bursts (first 45% of burst slots)
    const sendA = idx <= 2;
    const sendB = idx <= 1;
    parts.aState.textContent = sendA ? "BURSTING" : "IDLE";
    parts.bState.textContent = sendB ? "BURSTING" : "IDLE";

    if (sendA && local < 0.5) {
      const t = ease(local, 0, 0.5);
      parts.inA.setAttribute("transform", `translate(${lerp(202, 314, t).toFixed(1)} ${lerp(184, 240, t).toFixed(1)})`);
      parts.inA.setAttribute("opacity", (1 - ease(local, 0.38, 0.5)).toFixed(2));
    } else {
      parts.inA.setAttribute("opacity", "0");
    }

    if (sendB && local < 0.5) {
      const t = ease(local, 0, 0.5);
      parts.inB.setAttribute("transform", `translate(${lerp(202, 314, t).toFixed(1)} ${lerp(300, 240, t).toFixed(1)})`);
      parts.inB.setAttribute("opacity", (1 - ease(local, 0.38, 0.5)).toFixed(2));
    } else {
      parts.inB.setAttribute("opacity", "0");
    }

    // Shared link transmission
    if (slot.send) {
      const x = lerp(552, 868, local);
      parts.linkPkt.setAttribute("transform", `translate(${x.toFixed(1)} 240)`);
      parts.linkPkt.setAttribute("opacity", Math.min(1, local * 10, (1 - local) * 10).toFixed(2));
      const rect = parts.linkPkt.querySelector("rect");
      rect.setAttribute("fill", slot.send === "A" ? "var(--sr-amber)" : "var(--scene-teal)");
      if (parts.linkTxt.textContent !== slot.send) parts.linkTxt.textContent = slot.send;
    } else {
      parts.linkPkt.setAttribute("opacity", "0");
    }
  },
});
