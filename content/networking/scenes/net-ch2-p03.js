import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const artwork = `
  <defs>
    <pattern id="net2-p03-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#net2-p03-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">MAY 1973 · XEROX PARC · METCALFE &amp; BOGGS</text>
  <text x="48" y="88" class="sc-title" font-size="30">CSMA/CD: listen before and while talking</text>

  <g transform="translate(700 38)">
    <rect width="212" height="32" rx="16" class="sc-card"/>
    <text x="106" y="20" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">50Ω PASSIVE COAXIAL ETHER</text>
  </g>

  <!-- Workstation & Printer Cards -->
  <g transform="translate(64 114)">
    <rect data-part="cardA" width="216" height="82" rx="10" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--scene-teal)"/>
    <text x="36" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">ALTO A</text>
    <text data-part="stateA" x="22" y="56" class="sc-mono" font-size="11" fill="var(--scene-teal)">SENDING TO EARS</text>
  </g>

  <g transform="translate(372 114)">
    <rect data-part="cardB" width="216" height="82" rx="10" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--sr-amber)"/>
    <text x="36" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">ALTO B</text>
    <text data-part="stateB" x="22" y="56" class="sc-mono" font-size="11" fill="var(--sr-amber)">CARRIER SENSE · DEFER</text>
  </g>

  <g transform="translate(680 114)">
    <rect data-part="cardEars" width="216" height="82" rx="10" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--sr-ink-secondary)"/>
    <text x="36" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">EARS PRINTER</text>
    <text data-part="stateP" x="22" y="56" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">RECEIVING</text>
  </g>

  <!-- Transceiver Taps -->
  <line x1="172" y1="196" x2="172" y2="236" class="sc-wire"/>
  <line x1="480" y1="196" x2="480" y2="236" class="sc-wire"/>
  <line x1="788" y1="196" x2="788" y2="236" class="sc-wire"/>

  <!-- Passive Coaxial Bus + 50 Ohm Terminators -->
  <rect x="48" y="226" width="28" height="20" rx="4" class="sc-panel" stroke="var(--sr-border-strong)"/>
  <text x="62" y="240" text-anchor="middle" class="sc-mono" font-size="9" fill="var(--sr-ink-muted)">50Ω</text>
  <rect x="884" y="226" width="28" height="20" rx="4" class="sc-panel" stroke="var(--sr-border-strong)"/>
  <text x="898" y="240" text-anchor="middle" class="sc-mono" font-size="9" fill="var(--sr-ink-muted)">50Ω</text>

  <line x1="78" y1="236" x2="882" y2="236" stroke="var(--sr-border-strong)" stroke-width="8" stroke-linecap="round"/>
  <line data-part="busGlow" x1="78" y1="236" x2="882" y2="236" stroke="var(--scene-teal)" stroke-width="5" stroke-linecap="round" opacity="0"/>

  <!-- Tap Nodes -->
  <circle cx="172" cy="236" r="7" fill="var(--scene-teal)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
  <circle cx="480" cy="236" r="7" fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
  <circle cx="788" cy="236" r="7" fill="var(--sr-ink-secondary)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>

  <!-- Moving Voltage Signals on Bus -->
  <g data-part="sigA" opacity="0">
    <rect x="-24" y="-12" width="48" height="24" rx="5" fill="var(--scene-teal)"/>
    <text y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">DATA A</text>
  </g>
  <g data-part="sigB" opacity="0">
    <rect x="-24" y="-12" width="48" height="24" rx="5" fill="var(--sr-amber)"/>
    <text y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">DATA B</text>
  </g>

  <!-- Collision Flash & Jam Badge on Coax -->
  <circle data-part="clash" cx="326" cy="236" r="16" fill="none" stroke="var(--scene-crimson)" stroke-width="3" opacity="0"/>
  <g data-part="jamPill" transform="translate(326 266)" opacity="0">
    <rect x="-78" y="-11" width="156" height="22" rx="11" fill="var(--scene-crimson)" />
    <text x="0" y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">ABORT + 32-BIT JAM</text>
  </g>

  <!-- Live Oscilloscope Card -->
  <g transform="translate(48 292)">
    <rect width="864" height="148" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">TRANSCEIVER VOLTAGE MONITOR (COLLISION DETECTION)</text>
    <text data-part="scopeMode" x="844" y="24" text-anchor="end" class="sc-mono" font-size="11" fill="var(--scene-teal)">1× CARRIER LEVEL</text>

    <!-- Threshold line -->
    <line x1="20" y1="54" x2="844" y2="54" stroke="var(--scene-crimson)" stroke-width="1.2" stroke-dasharray="6 4"/>
    <text x="24" y="48" class="sc-mono" font-size="10" fill="var(--scene-crimson)">2× COLLISION THRESHOLD</text>

    <!-- Baseline -->
    <line x1="20" y1="118" x2="844" y2="118" stroke="var(--sr-border-strong)" stroke-width="1.2"/>
    <text x="24" y="134" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">0V IDLE</text>

    <!-- Waveforms -->
    <path data-part="waveNormal" d="M20 118 H120 V86 H180 V118 H240 V86 H300 V118 H360 V86 H420 V118 H480 V86 H540 V118 H600 V86 H660 V118 H844"
          fill="none" stroke="var(--scene-teal)" stroke-width="2.5" opacity="0"/>
    <path data-part="waveSpike" d="M20 118 H220 V86 H260 V42 H310 V86 H340 V40 H390 V118 L420 44 L445 118 L470 44 L495 118 L520 44 L545 118 H844"
          fill="none" stroke="var(--scene-crimson)" stroke-width="3" opacity="0"/>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--scene-teal)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">ALTO B HEARS CARRIER ON COAX AND DEFERS</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--scene-teal)">CSMA: LISTEN BEFORE TALK</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch2-p03",
  description: "Xerox PARC Alto workstations share a 50-ohm coaxial Ether cable. Alto B defers while sensing Alto A's carrier, then both transmit simultaneously, crossing the 2x collision threshold and emitting an abort jam signal.",
  artwork,
  duration: 10.0,
  still: 5.0,
  draw(parts, time) {
    // Phase 1 (0..3.4s): Alto A sends cleanly to EARS while Alto B defers
    // Phase 2 (3.4..7.2s): Both sense idle and collide -> 2x voltage + 32-bit jam signal
    // Phase 3 (7.2..10.0s): Wire settles idle for seamless loop
    const p1 = (time - 0.3) / 2.7;
    const p2A = (time - 3.7) / 1.15;
    const p2B = (time - 3.7) / 1.15;
    const jamPulse = windowPulse(time, 4.75, 5.6, 7.2);

    if (p1 > 0 && p1 < 1) {
      parts.sigA.setAttribute("transform", `translate(${lerp(172, 788, ease(time, 0.3, 3.0)).toFixed(1)} 236)`);
      parts.sigA.setAttribute("opacity", Math.min(1, p1 * 10, (1 - p1) * 10).toFixed(2));
      parts.sigB.setAttribute("opacity", "0");
    } else if (p2A > 0 && p2A < 1.15) {
      const t = Math.min(1, p2A);
      parts.sigA.setAttribute("transform", `translate(${lerp(172, 326, t).toFixed(1)} 236)`);
      parts.sigB.setAttribute("transform", `translate(${lerp(480, 326, t).toFixed(1)} 236)`);
      const vis = Math.min(1, p2A * 10, (1.15 - p2A) * 6);
      parts.sigA.setAttribute("opacity", Math.max(0, vis).toFixed(2));
      parts.sigB.setAttribute("opacity", Math.max(0, vis).toFixed(2));
    } else {
      parts.sigA.setAttribute("opacity", "0");
      parts.sigB.setAttribute("opacity", "0");
    }

    parts.clash.setAttribute("r", (16 + 44 * ease(time, 4.75, 6.2)).toFixed(1));
    parts.clash.setAttribute("opacity", jamPulse.toFixed(2));
    parts.jamPill.setAttribute("opacity", jamPulse.toFixed(2));

    const normalVis = windowPulse(time, 0.25, 1.5, 3.2);
    const spikeVis = windowPulse(time, 4.7, 5.7, 7.4);
    parts.waveNormal.setAttribute("opacity", normalVis.toFixed(2));
    parts.waveSpike.setAttribute("opacity", spikeVis.toFixed(2));
    parts.busGlow.setAttribute("opacity", Math.max(normalVis * 0.45, spikeVis * 0.65).toFixed(2));
    parts.busGlow.setAttribute("stroke", spikeVis > 0.2 ? "var(--scene-crimson)" : "var(--scene-teal)");

    let sA = "SENDING TO EARS";
    let sB = "CARRIER SENSE · DEFER";
    let sP = "RECEIVING";
    let scope = "1× CARRIER LEVEL";
    let scopeColor = "var(--scene-teal)";
    let status = "ALTO B HEARS CARRIER ON COAX AND DEFERS";
    let tally = "CSMA: LISTEN BEFORE TALK";
    let dot = "var(--scene-teal)";

    if (time >= 3.2 && time < 4.75) {
      sA = "WIRE IDLE · SENDING";
      sB = "WIRE IDLE · SENDING";
      sP = "LISTENING";
      status = "BOTH ALTOS HEAR IDLE WIRE AND FIRE TOGETHER";
      tally = "PROPAGATION DELAY WINDOW";
      dot = "var(--sr-amber)";
    } else if (time >= 4.75 && time < 7.2) {
      sA = "COLLISION · ABORT!";
      sB = "COLLISION · JAM!";
      sP = "DISCARDING";
      scope = "2× VOLTAGE SPIKE · JAM";
      scopeColor = "var(--scene-crimson)";
      status = "SUMMED VOLTAGE TRIGGERS INSTANT ABORT & 32-BIT JAM";
      tally = "CD: STOP WASTING WIRE TIME";
      dot = "var(--scene-crimson)";
    } else if (time >= 7.2) {
      sA = "BACKOFF TIMER";
      sB = "BACKOFF TIMER";
      sP = "IDLE";
      scope = "0V LINE CLEAR";
      scopeColor = "var(--sr-ink-muted)";
      status = "COAX CLEARS IMMEDIATELY FOR RANDOM BACKOFF RETRY";
      tally = "RESETTING BUS…";
      dot = "var(--sr-amber)";
    }

    if (parts.stateA.textContent !== sA) parts.stateA.textContent = sA;
    if (parts.stateB.textContent !== sB) parts.stateB.textContent = sB;
    if (parts.stateP.textContent !== sP) parts.stateP.textContent = sP;
    if (parts.scopeMode.textContent !== scope) parts.scopeMode.textContent = scope;
    parts.scopeMode.setAttribute("fill", scopeColor);
    if (parts.status.textContent !== status) parts.status.textContent = status;
    if (parts.tally.textContent !== tally) parts.tally.textContent = tally;
    parts.dot.setAttribute("fill", dot);
  },
});
