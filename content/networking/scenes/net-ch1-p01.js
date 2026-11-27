import { createLoopingScene, ease, lerp } from "./looping-scene.js";

const artwork = `
  <defs>
    <pattern id="p01-dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="var(--sr-ink-muted)" opacity="0.28"/>
    </pattern>
    <radialGradient id="p01-lamp-pool" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--sr-amber)" stop-opacity="0.26"/>
      <stop offset="55%" stop-color="var(--sr-amber)" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="var(--sr-amber)" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="p01-beam" x1="1" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="var(--sr-amber)" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="var(--sr-amber)" stop-opacity="0"/>
    </linearGradient>
    <pattern id="p01-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20 0H0V20" fill="none" stroke="var(--sr-amber)" stroke-opacity="0.16" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#p01-dots)"/>

  <!-- Ambient warm lamp pool + overhead beam -->
  <ellipse data-part="pool" cx="510" cy="300" rx="340" ry="200" fill="url(#p01-lamp-pool)"/>
  <polygon data-part="beam" points="825,26 912,26 670,490 220,390" fill="url(#p01-beam)"/>

  <!-- Editorial Header -->
  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">ARCHIVE DESK · BRIEFING 01</text>
  <text x="48" y="88" class="sc-title" font-size="30">Every rule has a reason</text>

  <!-- Line Status Oscilloscope (Top Left) -->
  <g transform="translate(48 118)">
    <rect width="246" height="106" rx="10" class="sc-card"/>
    <text x="16" y="26" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">LINE MONITOR · TRUNK 01</text>
    <rect x="16" y="38" width="214" height="44" rx="6" class="sc-panel"/>
    <line x1="26" y1="60" x2="220" y2="60" stroke="var(--sr-border-strong)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line data-part="scanLine" x1="26" y1="60" x2="220" y2="60" stroke="var(--scene-crimson)" stroke-width="2" opacity="0.8"/>
    <circle data-part="scanDot" cx="26" cy="60" r="3.5" fill="var(--scene-crimson)"/>
    <circle cx="24" cy="94" r="3.5" fill="var(--scene-crimson)"/>
    <text x="35" y="98" class="sc-mono" font-size="11" fill="var(--scene-crimson)">DEAD LINE · 0 Hz</text>
  </g>

  <!-- Open Jack Socket (Left Center) -->
  <g transform="translate(152 332)">
    <rect x="-56" y="-44" width="112" height="88" rx="12" class="sc-card"/>
    <circle data-part="socketRing" cx="0" cy="-4" r="24" fill="none" stroke="var(--sr-amber)" stroke-width="2" opacity="0.5"/>
    <circle cx="0" cy="-4" r="16" class="sc-panel"/>
    <circle cx="0" cy="-4" r="8" fill="var(--sr-border-strong)"/>
    <text x="0" y="32" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">JACK 01 · OPEN</text>
  </g>

  <!-- Drafted Protocol Blueprint Sheet -->
  <g data-part="sheet" transform="translate(310 132)">
    <g transform="rotate(-3 200 135)">
      <rect x="6" y="10" width="400" height="270" rx="10" fill="var(--sr-bg-canvas)" opacity="0.45"/>
      <rect width="400" height="270" rx="10" class="sc-card"/>
      <rect x="16" y="16" width="368" height="238" rx="6" fill="url(#p01-grid)" stroke="var(--sr-amber)" stroke-opacity="0.35"/>

      <text x="32" y="46" class="sc-mono" font-size="12" fill="var(--sr-amber)">FIG 01 · PROTOCOL BLUEPRINT</text>
      <text x="32" y="76" class="sc-title" font-size="22">Shared Rules for Machines</text>

      <!-- Animated blueprint framing lines -->
      <path data-part="inkFrame" d="M32 102 H368 V192 H32 Z" fill="none" stroke="var(--sr-ink)" stroke-width="1.5" stroke-opacity="0.7" pathLength="1"/>
      <path data-part="inkDivs" d="M138 102 V192 M254 102 V192 M32 134 H368" fill="none" stroke="var(--sr-amber)" stroke-width="1.25" pathLength="1"/>

      <g data-part="inkLabels" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">
        <text x="44" y="122">01 HEADER</text>
        <text x="150" y="122">02 ROUTE</text>
        <text x="266" y="122">03 PAYLOAD</text>
        <text x="44" y="166" fill="var(--sr-ink)">ADDR / SEQ</text>
        <text x="150" y="166" fill="var(--sr-ink)">HOP RULES</text>
        <text x="266" y="166" fill="var(--sr-ink)">DATA SLICE</text>
      </g>

      <!-- Corner registration marks -->
      <path d="M26 238 H160 M280 238 H368" stroke="var(--sr-border-strong)" stroke-width="1.5"/>
      <text x="32" y="226" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">STATUS: AWAITING CONNECTION</text>
    </g>
  </g>

  <!-- Overhead Desk Lamp Shade (Top Right) -->
  <g transform="translate(868 28)">
    <path d="M-48 8 L48 8 L30 -18 L-30 -18 Z" class="sc-card"/>
    <ellipse cx="0" cy="8" rx="44" ry="8" fill="var(--sr-amber)" opacity="0.85"/>
  </g>

  <!-- Foreground Patch Cord + Brass TRS Plug -->
  <g data-part="cord">
    <path d="M248 330 C320 330, 350 442, 474 446 C598 450, 740 426, 980 486"
          fill="none" stroke="var(--sr-bg-canvas)" stroke-width="12" stroke-linecap="round" opacity="0.5" transform="translate(0 5)"/>
    <path d="M248 330 C320 330, 350 442, 474 446 C598 450, 740 426, 980 486"
          fill="none" stroke="var(--sr-border-strong)" stroke-width="8" stroke-linecap="round"/>
    <path d="M248 330 C320 330, 350 442, 474 446 C598 450, 740 426, 980 486"
          fill="none" stroke="var(--sr-amber)" stroke-width="2" stroke-dasharray="6 6" stroke-linecap="round" opacity="0.75"/>
    <!-- Plug barrel + brass tip -->
    <g transform="translate(248 330)">
      <rect x="-12" y="-9" width="46" height="18" rx="4" class="sc-card"/>
      <path d="M-12 -5 H-36 L-44 0 L-36 5 H-12 Z" fill="var(--sr-amber)" stroke="var(--sr-ink)" stroke-width="1"/>
      <line x1="-24" y1="-5" x2="-24" y2="5" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
    </g>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch1-p01",
  description: "Overhead archive desk under a warm lamp cone. A protocol blueprint glides into the light and draws its frame lines while an unplugged patch cord hovers just short of an open line jack.",
  artwork,
  duration: 8.5,
  still: 3.6,
  draw({ pool, beam, scanDot, socketRing, sheet, inkFrame, inkDivs, inkLabels, cord }, time) {
    const enter = ease(time, 0.2, 2.0) - ease(time, 6.6, 8.3);
    const drawLine = ease(time, 1.3, 2.8) * (1 - ease(time, 6.8, 8.2));
    const plugApproach = ease(time, 0.6, 2.7) - ease(time, 6.2, 8.3);

    // Seamless cyclic scan dot across the dead-line oscilloscope
    const scanX = 26 + ((time / 2.8) % 1) * 194;
    scanDot.setAttribute("cx", scanX.toFixed(1));

    // Blueprint glides in from right and rotates slightly into rest
    const sx = lerp(120, 0, enter);
    const sy = lerp(34, 0, enter);
    sheet.setAttribute("transform", `translate(${(310 + sx).toFixed(1)} ${(132 + sy).toFixed(1)})`);
    sheet.setAttribute("opacity", (0.45 + 0.55 * enter).toFixed(3));

    // Blueprint ink trace draws on inside the sheet
    inkFrame.setAttribute("stroke-dashoffset", (1 - drawLine).toFixed(3));
    inkFrame.setAttribute("stroke-dasharray", "1");
    inkDivs.setAttribute("stroke-dashoffset", (1 - ease(time, 1.8, 3.2) * (1 - ease(time, 6.8, 8.2))).toFixed(3));
    inkDivs.setAttribute("stroke-dasharray", "1");
    inkLabels.setAttribute("opacity", (ease(time, 2.3, 3.3) * (1 - ease(time, 6.6, 7.8))).toFixed(3));

    // Cord & TRS plug approach Jack 01 and pause just short of plugging in
    const cx = lerp(145, 0, plugApproach);
    const cy = lerp(42, 0, plugApproach);
    cord.setAttribute("transform", `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`);

    // Subtle open-socket pulse & lamp breath
    const pulse = 0.5 + 0.5 * Math.sin((time / 8.5) * Math.PI * 4);
    socketRing.setAttribute("r", (22 + 5 * pulse).toFixed(1));
    socketRing.setAttribute("opacity", (0.25 + 0.45 * (1 - pulse)).toFixed(3));
    pool.setAttribute("opacity", (0.72 + 0.28 * enter).toFixed(3));
    beam.setAttribute("opacity", (0.65 + 0.35 * enter).toFixed(3));
  },
});
