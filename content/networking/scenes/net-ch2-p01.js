import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const artwork = `
  <defs>
    <pattern id="net2-p01-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#net2-p01-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1970 · NORMAN ABRAMSON · ALOHANET</text>
  <text x="48" y="88" class="sc-title" font-size="30">Pure ALOHA: speak anytime, collide often</text>

  <!-- Peak Efficiency Badge -->
  <g transform="translate(716 38)">
    <rect width="196" height="32" rx="16" class="sc-card"/>
    <text data-part="effBadge" x="98" y="20" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-amber)">EFFICIENCY CAP · 18.4%</text>
  </g>

  <!-- Top Radio Map Card -->
  <g transform="translate(48 112)">
    <rect width="864" height="148" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">SHARED INBOUND UHF CHANNEL (407.350 MHZ)</text>
    <text x="844" y="24" text-anchor="end" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">UNSLOTTED RANDOM ACCESS</text>

    <!-- Dashed radio paths -->
    <line x1="176" y1="90" x2="380" y2="90" stroke="var(--sr-border-strong)" stroke-width="2" stroke-dasharray="5 5"/>
    <line x1="688" y1="90" x2="484" y2="90" stroke="var(--sr-border-strong)" stroke-width="2" stroke-dasharray="5 5"/>

    <!-- Island A Station -->
    <g transform="translate(24 52)">
      <rect width="152" height="72" rx="8" class="sc-panel" stroke="var(--sr-amber)"/>
      <circle cx="20" cy="24" r="5" fill="var(--sr-amber)"/>
      <text x="34" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">ISLAND A</text>
      <text data-part="aTimer" x="20" y="54" class="sc-mono" font-size="11" fill="var(--sr-amber)">TX READY</text>
    </g>

    <!-- Central Oahu Hub -->
    <g transform="translate(362 46)">
      <rect data-part="hubBox" width="140" height="84" rx="10" class="sc-panel"/>
      <circle cx="70" cy="30" r="8" fill="none" stroke="var(--sr-ink-secondary)" stroke-width="2"/>
      <circle data-part="hubCore" cx="70" cy="30" r="4" fill="var(--sr-ink-secondary)"/>
      <text x="70" y="56" text-anchor="middle" class="sc-mono" font-size="12" fill="var(--sr-ink)">OAHU HUB</text>
      <text data-part="hubState" x="70" y="74" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">LISTENING</text>
    </g>

    <!-- Island B Station -->
    <g transform="translate(688 52)">
      <rect width="152" height="72" rx="8" class="sc-panel" stroke="var(--scene-teal)"/>
      <circle cx="20" cy="24" r="5" fill="var(--scene-teal)"/>
      <text x="34" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">ISLAND B</text>
      <text data-part="bTimer" x="20" y="54" class="sc-mono" font-size="11" fill="var(--scene-teal)">TX READY</text>
    </g>

    <!-- Traveling UHF Wave Bursts -->
    <g data-part="waveA" opacity="0">
      <rect x="-20" y="-12" width="40" height="24" rx="5" fill="var(--sr-amber)"/>
      <text y="4" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)">PKT A</text>
    </g>
    <g data-part="waveB" opacity="0">
      <rect x="-20" y="-12" width="40" height="24" rx="5" fill="var(--scene-teal)"/>
      <text y="4" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)">PKT B</text>
    </g>
    <circle data-part="clashRing" cx="432" cy="90" r="18" fill="none" stroke="var(--scene-crimson)" stroke-width="3" opacity="0"/>
  </g>

  <!-- Bottom Vulnerable Window Timeline Card -->
  <g transform="translate(48 276)">
    <rect width="864" height="164" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">TIME AXIS · ANY OVERLAP ACROSS 2T DESTROYS BOTH PACKETS</text>

    <!-- 2T Vulnerable Window Band -->
    <rect data-part="vulnBand" x="148" y="42" width="240" height="84" rx="6" fill="var(--scene-crimson-soft)" stroke="var(--scene-crimson)" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.35"/>
    <text data-part="vulnLabel" x="268" y="146" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--scene-crimson)">2T VULNERABLE WINDOW</text>

    <!-- Base time axis -->
    <line x1="20" y1="84" x2="844" y2="84" stroke="var(--sr-border-strong)" stroke-width="1.5"/>

    <!-- Collision Phase Packets -->
    <rect data-part="barA1" x="148" y="48" width="120" height="28" rx="5" fill="var(--sr-amber)" opacity="0"/>
    <text data-part="txtA1" x="188" y="66" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">PKT A</text>

    <rect data-part="barB1" x="228" y="92" width="120" height="28" rx="5" fill="var(--scene-teal)" opacity="0"/>
    <text data-part="txtB1" x="308" y="110" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">PKT B</text>

    <!-- Overlap Highlight -->
    <rect data-part="overlapBox" x="228" y="46" width="40" height="76" rx="4" fill="var(--scene-crimson)" opacity="0"/>
    <text data-part="clashLabel" x="248" y="38" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-crimson)" opacity="0">CLASH!</text>

    <!-- Random Backoff & Clean Retry -->
    <rect data-part="backoffBox" x="380" y="54" width="144" height="20" rx="4" fill="var(--sr-bg-canvas)" stroke="var(--sr-border-strong)" opacity="0"/>
    <text data-part="backoffTxt" x="452" y="68" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-secondary)" opacity="0">BACKOFF: A=2T, B=5T</text>

    <rect data-part="barA2" x="540" y="48" width="120" height="28" rx="5" fill="var(--sr-amber)" opacity="0"/>
    <text data-part="txtA2" x="600" y="66" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">A RETRY · OK</text>

    <rect data-part="barB2" x="708" y="92" width="120" height="28" rx="5" fill="var(--scene-teal)" opacity="0"/>
    <text data-part="txtB2" x="768" y="110" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">B RETRY · OK</text>

    <!-- Playhead Cursor -->
    <line data-part="cursor" x1="40" y1="36" x2="40" y2="132" stroke="var(--sr-ink)" stroke-width="1.5" opacity="0.45"/>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--sr-amber)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">ISLAND A TRANSMITTING ON SHARED UHF</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--sr-amber)">THROUGHPUT CAP: 18.4%</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch2-p01",
  description: "ALOHAnet island stations transmit unslotted bursts on a shared UHF channel. When Packet B overlaps Packet A inside the 2T vulnerable window, both collide and wait out staggered random timeouts before retrying.",
  artwork,
  duration: 9.5,
  still: 3.4,
  draw(parts, time) {
    // Timeline cursor sweeps across x: 40..844
    const cursorX = lerp(40, 844, ease(time, 0.2, 8.8));
    parts.cursor.setAttribute("x1", cursorX.toFixed(1));
    parts.cursor.setAttribute("x2", cursorX.toFixed(1));

    // Phase 1: Packet A launches (0.4..2.4), Packet B overlaps mid-flight (1.2..3.2)
    const pA1 = (time - 0.4) / 2.0;
    const pB1 = (time - 1.2) / 2.0;
    const clash = windowPulse(time, 2.1, 2.9, 4.1);

    if (pA1 > 0 && pA1 < 1.1) {
      const t = Math.min(1, pA1);
      parts.waveA.setAttribute("transform", `translate(${lerp(196, 412, t).toFixed(1)} 90)`);
      parts.waveA.setAttribute("opacity", Math.min(1, pA1 * 8, (1.1 - pA1) * 6).toFixed(2));
    } else if (time >= 5.2 && time < 7.2) {
      const t = (time - 5.2) / 2.0;
      parts.waveA.setAttribute("transform", `translate(${lerp(196, 412, t).toFixed(1)} 90)`);
      parts.waveA.setAttribute("opacity", Math.min(1, t * 8, (1 - t) * 8).toFixed(2));
    } else {
      parts.waveA.setAttribute("opacity", "0");
    }

    if (pB1 > 0 && pB1 < 1.1) {
      const t = Math.min(1, pB1);
      parts.waveB.setAttribute("transform", `translate(${lerp(668, 452, t).toFixed(1)} 90)`);
      parts.waveB.setAttribute("opacity", Math.min(1, pB1 * 8, (1.1 - pB1) * 6).toFixed(2));
    } else if (time >= 7.0 && time < 8.8) {
      const t = (time - 7.0) / 1.8;
      parts.waveB.setAttribute("transform", `translate(${lerp(668, 452, t).toFixed(1)} 90)`);
      parts.waveB.setAttribute("opacity", Math.min(1, t * 8, (1 - t) * 8).toFixed(2));
    } else {
      parts.waveB.setAttribute("opacity", "0");
    }

    parts.clashRing.setAttribute("r", (18 + 38 * ease(time, 2.1, 3.6)).toFixed(1));
    parts.clashRing.setAttribute("opacity", clash.toFixed(2));

    // Timeline blocks fade cleanly at end of loop
    const endFade = 1 - ease(time, 8.85, 9.45);
    const barA1Vis = ease(time, 0.5, 1.0) * endFade;
    const barB1Vis = ease(time, 1.3, 1.8) * endFade;
    const overlapVis = (ease(time, 2.1, 2.45) - ease(time, 4.1, 4.7)) * endFade;
    const backoffVis = ease(time, 3.4, 3.9) * endFade;
    const barA2Vis = ease(time, 5.2, 5.7) * endFade;
    const barB2Vis = ease(time, 7.0, 7.5) * endFade;

    parts.barA1.setAttribute("opacity", barA1Vis.toFixed(2));
    parts.txtA1.setAttribute("opacity", barA1Vis.toFixed(2));
    parts.barB1.setAttribute("opacity", barB1Vis.toFixed(2));
    parts.txtB1.setAttribute("opacity", barB1Vis.toFixed(2));
    parts.overlapBox.setAttribute("opacity", Math.max(0, overlapVis).toFixed(2));
    parts.clashLabel.setAttribute("opacity", Math.max(0, overlapVis).toFixed(2));
    parts.backoffBox.setAttribute("opacity", backoffVis.toFixed(2));
    parts.backoffTxt.setAttribute("opacity", backoffVis.toFixed(2));
    parts.barA2.setAttribute("opacity", barA2Vis.toFixed(2));
    parts.txtA2.setAttribute("opacity", barA2Vis.toFixed(2));
    parts.barB2.setAttribute("opacity", barB2Vis.toFixed(2));
    parts.txtB2.setAttribute("opacity", barB2Vis.toFixed(2));
    parts.vulnBand.setAttribute("opacity", (0.3 + 0.55 * Math.max(0, overlapVis)).toFixed(2));

    // Station & Hub Readouts
    let aTxt = "TX READY";
    let bTxt = "TX READY";
    let hubTxt = "LISTENING";
    let hubStroke = "var(--sr-border)";
    let hubCore = "var(--sr-ink-secondary)";
    let status = "ISLAND A SENDS UNSLOTTED BURST";
    let dot = "var(--sr-amber)";

    if (time >= 1.2 && time < 2.1) {
      aTxt = "SENDING";
      bTxt = "SENDING BLINDLY";
      status = "ISLAND B TRANSMITS BEFORE A FINISHES";
    } else if (time >= 2.1 && time < 3.7) {
      aTxt = "NO ACK · GARBLED";
      bTxt = "NO ACK · GARBLED";
      hubTxt = "CRC FAIL · COLLISION";
      hubStroke = "var(--scene-crimson)";
      hubCore = "var(--scene-crimson)";
      status = "SINGLE-BIT OVERLAP CORRUPTS BOTH FRAMES";
      dot = "var(--scene-crimson)";
    } else if (time >= 3.7 && time < 5.2) {
      aTxt = "BACKOFF (2T)";
      bTxt = "BACKOFF (5T)";
      hubTxt = "CHANNEL CLEAR";
      status = "STAGGERED RANDOM TIMEOUTS SEPARATE RETRIES";
      dot = "var(--sr-amber)";
    } else if (time >= 5.2 && time < 7.0) {
      aTxt = "RETRYING";
      bTxt = "WAITING (3T LEFT)";
      hubTxt = "ACK -> ISLAND A";
      hubStroke = "var(--scene-teal)";
      hubCore = "var(--scene-teal)";
      status = "PACKET A CLEARS HUB WITHOUT OVERLAP";
      dot = "var(--scene-teal)";
    } else if (time >= 7.0 && time < 8.85) {
      aTxt = "ACK RECEIVED";
      bTxt = "RETRYING";
      hubTxt = "ACK -> ISLAND B";
      hubStroke = "var(--scene-teal)";
      hubCore = "var(--scene-teal)";
      status = "PACKET B SUCCEEDS AFTER LONGER BACKOFF";
      dot = "var(--scene-teal)";
    } else if (time >= 8.85) {
      hubTxt = "LISTENING";
      status = "RESETTING ALOHANET TIMELINE…";
    }

    if (parts.aTimer.textContent !== aTxt) parts.aTimer.textContent = aTxt;
    if (parts.bTimer.textContent !== bTxt) parts.bTimer.textContent = bTxt;
    if (parts.hubState.textContent !== hubTxt) parts.hubState.textContent = hubTxt;
    parts.hubBox.setAttribute("stroke", hubStroke);
    parts.hubCore.setAttribute("fill", hubCore);
    if (parts.status.textContent !== status) parts.status.textContent = status;
    parts.dot.setAttribute("fill", dot);
  },
});
