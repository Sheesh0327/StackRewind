import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const artwork = `
  <defs>
    <pattern id="p06-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#p06-grid)" opacity="0.5"/>

  <text x="48" y="50" class="sc-mono" font-size="13" fill="var(--sr-amber)">1969 · ARPANET FIRST LINK &amp; THE NEXT CRISIS</text>

  <!-- Card 1 (Top Left): Oct 29, 1969 UCLA -> SRI Login -->
  <g transform="translate(48 72)">
    <rect width="414" height="246" rx="12" class="sc-card"/>
    <text x="22" y="30" class="sc-mono" font-size="11" fill="var(--sr-amber)">OCT 29, 1969 · UCLA → SRI</text>
    <text x="22" y="58" class="sc-title" font-size="22">First ARPANET Login</text>

    <rect x="22" y="76" width="370" height="114" rx="8" class="sc-panel"/>
    <text x="40" y="102" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">SRI HOST TERMINAL</text>
    <g class="sc-mono" font-size="48" font-weight="700" fill="var(--sr-ink)">
      <text data-part="chL" x="42" y="164" opacity="0">L</text>
      <text data-part="chO" x="82" y="164" opacity="0">O</text>
    </g>
    <rect data-part="cursor" x="42" y="122" width="24" height="44" rx="2" fill="var(--sr-amber)"/>

    <g data-part="crashed" opacity="0">
      <circle cx="28" cy="216" r="4.5" fill="var(--scene-crimson)"/>
      <text x="42" y="220" class="sc-mono" font-size="11" fill="var(--scene-crimson)">HOST CRASHED AFTER "LO"</text>
    </g>
  </g>

  <!-- Card 2 (Top Right): Dec 1969 4-Node ARPANET -->
  <g transform="translate(482 72)">
    <rect width="430" height="246" rx="12" class="sc-card"/>
    <text x="22" y="30" class="sc-mono" font-size="11" fill="var(--sr-amber)">DEC 1969 · FOUR SITES ONLINE</text>
    <text x="22" y="58" class="sc-title" font-size="22">Packet Switching Scales</text>

    <rect x="22" y="76" width="386" height="148" rx="8" class="sc-panel"/>
    <!-- Backbone static lines -->
    <path d="M96 174 L172 114 L214 188 Z M172 114 L344 134" class="sc-wire"/>
    <path data-part="netWest" d="M214 188 L172 114 L96 174 Z" fill="none" stroke="var(--sr-amber)" stroke-width="3" stroke-linejoin="round" pathLength="1"/>
    <path data-part="netEast" d="M172 114 L344 134" fill="none" stroke="var(--scene-teal)" stroke-width="3" pathLength="1"/>

    <!-- Nodes -->
    <g fill="var(--sr-bg-elevated)" stroke="var(--sr-ink)" stroke-width="2">
      <circle cx="96" cy="174" r="8"/><circle cx="172" cy="114" r="8"/>
      <circle cx="214" cy="188" r="8"/><circle cx="344" cy="134" r="8"/>
    </g>
    <g class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">
      <text x="52" y="198">UCSB</text>
      <text x="158" y="98">SRI</text>
      <text x="200" y="212">UCLA</text>
      <text x="328" y="160">UTAH</text>
    </g>

    <!-- Packets crossing Dec 1969 network -->
    <rect data-part="pktW" x="-7" y="-5" width="14" height="10" rx="2" fill="var(--sr-amber)" opacity="0"/>
    <rect data-part="pktE" x="-7" y="-5" width="14" height="10" rx="2" fill="var(--scene-teal)" opacity="0"/>
  </g>

  <!-- Card 3 (Bottom Full Width): Next Crisis — Two Senders on One Wire -->
  <g transform="translate(48 338)">
    <rect width="864" height="164" rx="12" class="sc-card"/>
    <text x="24" y="30" class="sc-mono" font-size="11" fill="var(--sr-amber)">NEXT CRISIS · SHARED WIRE</text>
    <text x="24" y="56" class="sc-title" font-size="22">What if two computers talk at once?</text>

    <rect x="24" y="72" width="816" height="70" rx="8" class="sc-panel"/>
    <line x1="92" y1="107" x2="772" y2="107" class="sc-wire"/>

    <!-- Left & Right Hosts -->
    <rect x="44" y="87" width="48" height="40" rx="6" class="sc-card" stroke="var(--sr-amber)"/>
    <text x="68" y="111" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-amber)">H1</text>
    <rect x="772" y="87" width="48" height="40" rx="6" class="sc-card" stroke="var(--scene-teal)"/>
    <text x="796" y="111" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--scene-teal)">H2</text>

    <!-- Converging Signals -->
    <g data-part="sigLeft" opacity="0">
      <line x1="-22" y1="107" x2="8" y2="107" stroke="var(--sr-amber)" stroke-width="4" stroke-linecap="round"/>
      <polygon points="4,99 20,107 4,115" fill="var(--sr-amber)"/>
    </g>
    <g data-part="sigRight" opacity="0">
      <line x1="22" y1="107" x2="-8" y2="107" stroke="var(--scene-teal)" stroke-width="4" stroke-linecap="round"/>
      <polygon points="-4,99 -20,107 -4,115" fill="var(--scene-teal)"/>
    </g>

    <!-- Collision Shockwave + Interference -->
    <circle data-part="boomRing" cx="432" cy="107" r="10" fill="none" stroke="var(--scene-crimson)" stroke-width="3" opacity="0"/>
    <g data-part="boomBadge" transform="translate(432 107)" opacity="0">
      <path d="M-24 0 L-16 -12 L-8 10 L0 -14 L8 12 L16 -10 L24 0" fill="none" stroke="var(--scene-crimson)" stroke-width="3" stroke-linejoin="round"/>
      <rect x="-104" y="14" width="208" height="20" rx="10" fill="var(--scene-crimson-soft)" stroke="var(--scene-crimson)" stroke-width="1"/>
      <text x="0" y="28" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--scene-crimson)">COLLISION · GARBLED WIRE</text>
    </g>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch1-p06",
  description: "Three-part 1969 montage: UCLA-to-SRI crashes after L and O, four ARPANET sites exchange packets, and two hosts collide on a shared wire.",
  artwork,
  duration: 10.5,
  still: 8.3,
  draw(parts, time) {
    const reset = 1 - ease(time, 9.6, 10.4);

    // 1) UCLA -> SRI "LO" typing
    parts.chL.setAttribute("opacity", (ease(time, 0.55, 0.72) * reset).toFixed(2));
    parts.chO.setAttribute("opacity", (ease(time, 1.35, 1.52) * reset).toFixed(2));
    const curX = time < 0.72 ? 42 : time < 1.52 ? 82 : 124;
    parts.cursor.setAttribute("x", String(curX));
    const blink = 0.55 + 0.45 * Math.cos(time * 9);
    parts.cursor.setAttribute("opacity", ((1 - ease(time, 1.9, 2.25)) * blink * reset).toFixed(2));
    parts.crashed.setAttribute("opacity", (ease(time, 1.95, 2.4) * reset).toFixed(2));

    // 2) Dec 1969 4-node network
    const wDraw = ease(time, 2.4, 3.8);
    const eDraw = ease(time, 3.4, 4.6);
    parts.netWest.setAttribute("stroke-dasharray", `${wDraw.toFixed(3)} 1`);
    parts.netEast.setAttribute("stroke-dasharray", `${eDraw.toFixed(3)} 1`);
    parts.netWest.setAttribute("opacity", reset.toFixed(2));
    parts.netEast.setAttribute("opacity", reset.toFixed(2));

    const pktPhase = (time - 4.5) / 1.8;
    if (pktPhase > 0 && pktPhase < 1) {
      const op = Math.min(1, pktPhase * 10, (1 - pktPhase) * 10) * reset;
      parts.pktW.setAttribute("transform", `translate(${lerp(214, 96, pktPhase).toFixed(1)} ${lerp(188, 174, pktPhase).toFixed(1)})`);
      parts.pktE.setAttribute("transform", `translate(${lerp(172, 344, pktPhase).toFixed(1)} ${lerp(114, 134, pktPhase).toFixed(1)})`);
      parts.pktW.setAttribute("opacity", op.toFixed(2));
      parts.pktE.setAttribute("opacity", op.toFixed(2));
    } else {
      parts.pktW.setAttribute("opacity", "0");
      parts.pktE.setAttribute("opacity", "0");
    }

    // 3) Shared wire collision (6.0s -> 8.0s travel, 8.0s collision)
    const approach = ease(time, 6.0, 8.0);
    const sigVis = ease(time, 5.8, 6.1) * (1 - ease(time, 7.95, 8.15));
    parts.sigLeft.setAttribute("transform", `translate(${lerp(116, 414, approach).toFixed(1)} 0)`);
    parts.sigRight.setAttribute("transform", `translate(${lerp(748, 450, approach).toFixed(1)} 0)`);
    parts.sigLeft.setAttribute("opacity", sigVis.toFixed(2));
    parts.sigRight.setAttribute("opacity", sigVis.toFixed(2));

    const boomPulse = windowPulse(time, 7.95, 8.35, 9.6);
    parts.boomRing.setAttribute("r", (10 + 46 * ease(time, 7.95, 9.2)).toFixed(1));
    parts.boomRing.setAttribute("opacity", boomPulse.toFixed(2));
    parts.boomBadge.setAttribute("opacity", (ease(time, 7.95, 8.25) * reset).toFixed(2));
  },
});
