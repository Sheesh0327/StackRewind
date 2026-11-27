import { createLoopingScene, ease, lerp } from "./looping-scene.js";

const relays = [0, 1, 2, 3].map((idx) => {
  const x = 35 + idx * 46;
  return `<g transform="translate(${x} 46)">
    <rect x="-14" y="-12" width="28" height="36" rx="4" class="sc-panel"/>
    <circle cx="0" cy="-2" r="3" fill="var(--sr-ink-muted)"/>
    <circle cx="0" cy="14" r="3" fill="var(--sr-amber)"/>
    <line data-part="relay${idx}" x1="0" y1="14" x2="0" y2="-2" stroke="var(--sr-amber)" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
}).join("");

const dialHoles = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 1.5 - Math.PI * 0.9;
  const cx = Math.cos(angle) * 26;
  const cy = Math.sin(angle) * 26;
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="var(--sr-bg-canvas)" stroke="var(--sr-border-strong)" stroke-width="1.2"/>`;
}).join("");

const artwork = `
  <defs>
    <pattern id="p02-grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#p02-grid)" opacity="0.65"/>

  <!-- Editorial Header -->
  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1960 · ANALOG TELEPHONE NETWORK</text>
  <text x="48" y="88" class="sc-title" font-size="30">Brief burst, long silence</text>

  <!-- Trunk Line (Behind Terminals & Exchange) -->
  <path d="M220 210 H740" class="sc-wire"/>
  <path data-part="trunk" d="M220 210 H740" class="sc-amber-wire" pathLength="1"/>

  <!-- Rotary Dial Wheel (Left of Computer A) -->
  <g transform="translate(86 210)">
    <circle r="40" class="sc-card"/>
    <g data-part="dial">
      <circle r="34" class="sc-panel"/>
      ${dialHoles}
      <circle r="11" fill="var(--sr-amber-soft)" stroke="var(--sr-amber)" stroke-width="1.5"/>
    </g>
    <path d="M24 22 L38 30" stroke="var(--sr-amber)" stroke-width="3" stroke-linecap="round"/>
    <text x="0" y="64" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">DIAL</text>
  </g>

  <!-- Computer A -->
  <g transform="translate(150 152)">
    <rect width="144" height="112" rx="10" class="sc-card"/>
    <rect x="14" y="14" width="116" height="62" rx="6" class="sc-panel"/>
    <path d="M26 56 L42 56 L50 38 L58 62 L66 44 L76 56 L114 56" fill="none" stroke="var(--sr-amber)" stroke-width="2" stroke-linecap="round"/>
    <text x="72" y="96" text-anchor="middle" class="sc-mono" font-size="12" fill="var(--sr-ink)">COMPUTER A</text>
  </g>

  <!-- Central Electromechanical Crossbar Exchange -->
  <g transform="translate(376 132)">
    <rect width="208" height="148" rx="12" class="sc-card"/>
    <text x="104" y="24" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">CROSSBAR EXCHANGE</text>
    ${relays}
    <rect x="24" y="102" width="160" height="30" rx="6" class="sc-panel"/>
    <circle data-part="lockDot" cx="42" cy="117" r="4.5" fill="var(--sr-amber)"/>
    <text data-part="lockLabel" x="56" y="121" class="sc-mono" font-size="11" fill="var(--sr-amber)">TRUNK RESERVED</text>
  </g>

  <!-- Computer B + Wait Timer Ring -->
  <g transform="translate(666 152)">
    <rect width="144" height="112" rx="10" class="sc-card"/>
    <rect x="14" y="14" width="116" height="62" rx="6" class="sc-panel"/>
    <circle cx="72" cy="45" r="18" fill="none" stroke="var(--sr-border-strong)" stroke-width="3"/>
    <circle data-part="waitRing" cx="72" cy="45" r="18" fill="none" stroke="var(--sr-amber)" stroke-width="3"
            stroke-linecap="round" transform="rotate(-90 72 45)" pathLength="1"/>
    <text x="72" y="96" text-anchor="middle" class="sc-mono" font-size="12" fill="var(--sr-ink)">COMPUTER B</text>
  </g>

  <!-- Data Burst Pulses on Trunk -->
  <g fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2">
    <rect data-part="p0" y="202" width="22" height="16" rx="4"/>
    <rect data-part="p1" y="202" width="22" height="16" rx="4"/>
    <rect data-part="p2" y="202" width="22" height="16" rx="4"/>
  </g>

  <!-- Bottom Live Line Activity Oscilloscope Strip -->
  <g transform="translate(48 336)">
    <rect width="864" height="156" rx="12" class="sc-card"/>
    <text x="24" y="30" class="sc-mono" font-size="12" fill="var(--sr-ink-secondary)">LINE OCCUPANCY TIMELINE</text>
    <text data-part="phaseText" x="840" y="30" text-anchor="end" class="sc-mono" font-size="12" fill="var(--sr-amber)">DIALING EXCHANGE…</text>

    <rect x="24" y="46" width="816" height="72" rx="8" class="sc-panel"/>
    <!-- Baseline -->
    <line x1="44" y1="88" x2="820" y2="88" stroke="var(--sr-border-strong)" stroke-width="1.5"/>
    <!-- Burst waveform spikes (left section) + long silent flatline (right section) -->
    <path d="M44 88 H160 L172 60 L184 106 L196 56 L208 108 L220 62 L232 98 L244 88 H820"
          fill="none" stroke="var(--sr-border-strong)" stroke-width="2" stroke-linejoin="round"/>
    <path data-part="wave" d="M44 88 H160 L172 60 L184 106 L196 56 L208 108 L220 62 L232 98 L244 88 H820"
          fill="none" stroke="var(--sr-amber)" stroke-width="3" stroke-linejoin="round" pathLength="1"/>

    <text x="195" y="138" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-amber)">SHORT BURST</text>
    <text x="540" y="138" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">LONG SILENCE — LINE LOCKED &amp; IDLE</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch1-p02",
  description: "A 1960 rotary dial clicks four exchange relays shut, sends a short data burst from Computer A to Computer B, then leaves the reserved line silent while Computer B waits.",
  artwork,
  duration: 9.0,
  still: 3.1,
  draw(parts, time) {
    const dialSpin = ease(time, 0.2, 1.2) - ease(time, 7.6, 8.8);
    const lock = ease(time, 1.0, 1.5) - ease(time, 7.5, 8.4);
    const waveProg = ease(time, 1.4, 7.2) * (1 - ease(time, 7.7, 8.8));
    const waitProg = ease(time, 3.4, 7.3) * (1 - ease(time, 7.5, 8.6));

    parts.dial.setAttribute("transform", `rotate(${(135 * dialSpin).toFixed(1)})`);

    // 4 crossbar relays pivot shut -> open
    for (let i = 0; i < 4; i++) {
      const arm = parts[`relay${i}`];
      const closed = ease(time, 0.9 + i * 0.1, 1.25 + i * 0.1) - ease(time, 7.4 + i * 0.08, 8.1 + i * 0.08);
      const x2 = lerp(-10, 0, closed);
      const y2 = lerp(-6, -2, closed);
      arm.setAttribute("x2", x2.toFixed(1));
      arm.setAttribute("y2", y2.toFixed(1));
      arm.setAttribute("opacity", (0.35 + 0.65 * closed).toFixed(2));
    }

    parts.trunk.setAttribute("stroke-dasharray", `${lock.toFixed(3)} 1`);
    parts.trunk.setAttribute("opacity", (0.2 + 0.8 * lock).toFixed(2));
    parts.lockDot.setAttribute("opacity", lock.toFixed(2));
    parts.lockLabel.textContent = lock > 0.5 ? "TRUNK RESERVED" : "LINE IDLE";

    // 3 short burst packets travel from Computer A (294) to Computer B (650)
    [0, 1, 2].forEach((idx) => {
      const p = parts[`p${idx}`];
      const start = 1.55 + idx * 0.26;
      const prog = (time - start) / 1.45;
      const visible = prog > 0 && prog < 1;
      if (visible) {
        const x = lerp(294, 646, prog);
        p.setAttribute("x", x.toFixed(1));
        p.setAttribute("opacity", Math.min(1, prog * 12, (1 - prog) * 12).toFixed(2));
      } else {
        p.setAttribute("opacity", "0");
      }
    });

    parts.wave.setAttribute("stroke-dasharray", `${waveProg.toFixed(3)} 1`);
    parts.waitRing.setAttribute("stroke-dasharray", `${waitProg.toFixed(3)} 1`);
    parts.waitRing.setAttribute("opacity", (0.25 + 0.75 * waitProg).toFixed(2));

    let label = "DIALING EXCHANGE…";
    if (time >= 1.5 && time < 3.4) label = "SENDING BRIEF DATA BURST";
    else if (time >= 3.4 && time < 7.5) label = "SILENT · WAITING FOR REPLY (LINE LOCKED)";
    else if (time >= 7.5) label = "RELEASING CIRCUIT…";
    if (parts.phaseText.textContent !== label) parts.phaseText.textContent = label;
  },
});
