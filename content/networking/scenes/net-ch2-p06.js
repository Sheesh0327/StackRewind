import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const artwork = `
  <defs>
    <pattern id="net2-p06-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#net2-p06-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1983 · THE NEXT CRISIS · INCOMPATIBLE ISLANDS</text>
  <text x="48" y="88" class="sc-title" font-size="30">Flat MAC addresses stop at the local wire</text>

  <g transform="translate(700 38)">
    <rect width="212" height="32" rx="16" class="sc-card"/>
    <text x="106" y="20" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--scene-crimson)">NO GLOBAL ROUTING LAYER</text>
  </g>

  <!-- Left Island: Ethernet LAN (1983) -->
  <g transform="translate(48 118)">
    <rect width="310" height="320" rx="12" class="sc-card"/>
    <text x="20" y="28" class="sc-mono" font-size="11" fill="var(--scene-teal)">ETHERNET LAN (IEEE 802.3)</text>
    <text data-part="lanSub" x="20" y="48" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">SHARED COLLISION DOMAIN → SWITCHED PORTS</text>

    <!-- Hosts inside LAN -->
    <rect x="24" y="76" width="84" height="44" rx="6" class="sc-panel" stroke="var(--scene-teal)"/>
    <text x="66" y="102" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink)">AA:10</text>

    <rect x="24" y="144" width="84" height="44" rx="6" class="sc-panel" stroke="var(--scene-teal)"/>
    <text x="66" y="170" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink)">BB:34</text>

    <rect x="24" y="212" width="84" height="44" rx="6" class="sc-panel" stroke="var(--scene-teal)"/>
    <text x="66" y="238" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink)">CC:9F</text>

    <!-- Shared coax vs switched port lines -->
    <line data-part="sharedBus" x1="158" y1="84" x2="158" y2="248" stroke="var(--sr-amber)" stroke-width="5" stroke-linecap="round"/>
    <line x1="108" y1="98" x2="158" y2="98" class="sc-wire"/>
    <line x1="108" y1="166" x2="158" y2="166" class="sc-wire"/>
    <line x1="108" y1="234" x2="158" y2="234" class="sc-wire"/>

    <!-- Dedicated switch box fades in -->
    <g data-part="switchBox" opacity="0">
      <rect x="136" y="110" width="90" height="112" rx="8" class="sc-panel" stroke="var(--scene-teal)"/>
      <text x="181" y="160" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--scene-teal)">SWITCH</text>
      <text x="181" y="178" text-anchor="middle" class="sc-mono" font-size="9" fill="var(--sr-ink-muted)">ISOLATED PORTS</text>
      <line x1="108" y1="98" x2="136" y2="132" stroke="var(--scene-teal)" stroke-width="2.5"/>
      <line x1="108" y1="166" x2="136" y2="166" stroke="var(--scene-teal)" stroke-width="2.5"/>
      <line x1="108" y1="234" x2="136" y2="200" stroke="var(--scene-teal)" stroke-width="2.5"/>
    </g>

    <text x="20" y="294" class="sc-mono" font-size="10" fill="var(--sr-ink-secondary)">ONLY KNOWS LOCAL 48-BIT MACS</text>
  </g>

  <!-- Gap & Dashed Boundary -->
  <line x1="358" y1="278" x2="454" y2="278" stroke="var(--sr-amber)" stroke-width="2.5" stroke-dasharray="6 5"/>
  <line x1="546" y1="278" x2="642" y2="196" stroke="var(--sr-border-strong)" stroke-width="2" stroke-dasharray="5 5"/>
  <line x1="546" y1="278" x2="642" y2="360" stroke="var(--sr-border-strong)" stroke-width="2" stroke-dasharray="5 5"/>

  <g transform="translate(366 206)">
    <rect width="128" height="32" rx="6" fill="var(--scene-crimson-soft)" stroke="var(--scene-crimson)" stroke-width="1"/>
    <text x="64" y="14" text-anchor="middle" class="sc-mono" font-size="9" fill="var(--scene-crimson)">FLAT MAC · NO</text>
    <text x="64" y="26" text-anchor="middle" class="sc-mono" font-size="9" fill="var(--scene-crimson)">GLOBAL ROUTE?</text>
  </g>

  <!-- Central ? Gateway Silhouette -->
  <g transform="translate(454 234)">
    <rect data-part="gwBox" width="92" height="88" rx="14" class="sc-card" stroke="var(--sr-amber)" stroke-dasharray="5 4"/>
    <text x="46" y="46" text-anchor="middle" class="sc-title" font-size="30" fill="var(--sr-amber)">?</text>
    <text x="46" y="70" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-secondary)">GATEWAY</text>
  </g>

  <!-- Moving Frame Hitting Boundary -->
  <g data-part="lostFrame" opacity="0">
    <rect x="-34" y="-14" width="68" height="28" rx="5" fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
    <text y="-1" text-anchor="middle" class="sc-mono" font-size="9" font-weight="700" fill="var(--scene-paper-ink)">802.3 FRAME</text>
    <text y="10" text-anchor="middle" class="sc-mono" font-size="8" font-weight="700" fill="var(--scene-paper-ink)">MAC ONLY</text>
  </g>

  <!-- Right Islands: ARPANET & PRNET -->
  <g transform="translate(642 118)">
    <rect width="270" height="150" rx="12" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--sr-amber)"/>
    <text x="36" y="28" class="sc-mono" font-size="11" fill="var(--sr-ink)">ARPANET · 50 KBPS</text>
    <rect x="20" y="48" width="230" height="44" rx="8" class="sc-panel"/>
    <text x="135" y="74" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-amber)">IMP 1822 HOST FORMAT</text>
    <text x="20" y="122" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">INCOMPATIBLE ADDRESSING</text>
  </g>

  <g transform="translate(642 288)">
    <rect width="270" height="150" rx="12" class="sc-card"/>
    <circle cx="22" cy="24" r="5" fill="var(--scene-teal)"/>
    <text x="36" y="28" class="sc-mono" font-size="11" fill="var(--sr-ink)">PACKET RADIO · PRNET</text>
    <rect x="20" y="48" width="230" height="44" rx="8" class="sc-panel"/>
    <text x="135" y="74" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--scene-teal)">MOBILE UHF RADIO FRAMES</text>
    <text x="20" y="122" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">INCOMPATIBLE MTU &amp; LINKS</text>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--scene-teal)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">SWITCHES ISOLATE PORTS TO ELIMINATE LAN COLLISIONS</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--sr-amber)">NEXT: INTERNETWORKING (IP)</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch2-p06",
  description: "Ethernet LANs, ARPANET IMP links, and Packet Radio PRNET sit as incompatible islands. Even after switches isolate LAN ports, flat 48-bit MAC frames halt at the boundary facing a shadowed gateway.",
  artwork,
  duration: 9.5,
  still: 6.2,
  draw(parts, time) {
    // Phase 1 (0..3.2s): Shared bus inside LAN transitions into isolated Switch ports
    const swVis = ease(time, 0.8, 2.2) - ease(time, 8.4, 9.3);
    parts.switchBox.setAttribute("opacity", Math.max(0, swVis).toFixed(2));
    parts.sharedBus.setAttribute("opacity", Math.max(0.15, 1 - swVis * 0.85).toFixed(2));

    // Phase 2 (3.2..7.8s): Outgoing frame leaves LAN, stalls at the boundary before ? GATEWAY
    const pOut = (time - 3.2) / 2.0;
    const bounce = windowPulse(time, 5.2, 6.2, 7.6);
    if (pOut > 0 && pOut <= 1) {
      parts.lostFrame.setAttribute("transform", `translate(${lerp(354, 414, ease(time, 3.2, 5.2)).toFixed(1)} 278)`);
      parts.lostFrame.setAttribute("opacity", Math.min(1, pOut * 18).toFixed(2));
    } else if (time > 5.2 && time < 7.8) {
      const jitter = Math.sin((time - 5.2) * 14) * 5 * bounce;
      parts.lostFrame.setAttribute("transform", `translate(${(414 + jitter).toFixed(1)} 278)`);
      parts.lostFrame.setAttribute("opacity", (1 - ease(time, 7.5, 7.8)).toFixed(2));
    } else {
      parts.lostFrame.setAttribute("opacity", "0");
    }

    parts.gwBox.setAttribute("stroke", time >= 5.2 && time < 8.4 ? "var(--scene-crimson)" : "var(--sr-amber)");

    let status = "SWITCHES ISOLATE PORTS TO ELIMINATE LAN COLLISIONS";
    let dot = "var(--scene-teal)";
    if (time >= 3.2 && time < 5.2) {
      status = "FRAME EXITS LAN LOOKING FOR AN OUTSIDE NETWORK";
      dot = "var(--sr-amber)";
    } else if (time >= 5.2 && time < 8.2) {
      status = "FLAT 48-BIT MAC CARRIES NO GLOBAL MAP ACROSS ISLANDS";
      dot = "var(--scene-crimson)";
    } else if (time >= 8.2) {
      status = "HOW DO SEPARATE NETWORKS SPEAK AS ONE INTERNET?";
      dot = "var(--sr-amber)";
    }

    if (parts.status.textContent !== status) parts.status.textContent = status;
    parts.dot.setAttribute("fill", dot);
  },
});
