import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const slotCols = [0, 1, 2, 3, 4].map((i) => {
  const x = 148 + i * 136;
  return `
    <line x1="${x}" y1="38" x2="${x}" y2="150" stroke="var(--sr-border-strong)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="${x + 68}" y="50" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">SLOT ${i + 1}</text>
  `;
}).join("");

const artwork = `
  <defs>
    <pattern id="net2-p02-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#net2-p02-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1972 · LAWRENCE ROBERTS · SLOTTED ALOHA</text>
  <text x="48" y="88" class="sc-title" font-size="30">Clock ticks halve the collision window</text>

  <!-- Master Clock Beacon Pill -->
  <g transform="translate(684 38)">
    <rect width="228" height="32" rx="16" class="sc-card"/>
    <circle data-part="clkDot" cx="20" cy="16" r="5" fill="var(--scene-teal)"/>
    <text x="34" y="20" class="sc-mono" font-size="11" fill="var(--sr-ink)">MASTER CLOCK · SLOT = 1T</text>
  </g>

  <!-- Top Comparison Lane: Pure ALOHA (2T) -->
  <g transform="translate(48 112)">
    <rect width="864" height="128" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">PURE ALOHA (UNSLOTTED · 2T VULNERABLE)</text>
    <rect x="732" y="10" width="112" height="22" rx="11" fill="var(--scene-crimson-soft)" stroke="var(--scene-crimson)" stroke-width="1"/>
    <text x="788" y="25" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--scene-crimson)">18.4% MAX</text>

    <line x1="20" y1="80" x2="844" y2="80" stroke="var(--sr-border-strong)" stroke-width="1.5"/>
    <rect x="148" y="48" width="136" height="26" rx="5" fill="var(--sr-amber)" opacity="0.88"/>
    <text x="195" y="65" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">PKT A</text>

    <rect x="242" y="86" width="136" height="26" rx="5" fill="var(--scene-teal)" opacity="0.88"/>
    <text x="331" y="103" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">B CLIPS TAIL</text>

    <rect x="242" y="46" width="42" height="68" rx="4" fill="var(--scene-crimson)" opacity="0.82"/>
    <text x="530" y="65" class="sc-mono" font-size="11" fill="var(--scene-crimson)">LATE START DESTROYS BOTH</text>
  </g>

  <!-- Bottom Slotted Lane (1T) -->
  <g transform="translate(48 256)">
    <rect width="864" height="184" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">SLOTTED ALOHA (BOUNDARY ALIGNED · 1T VULNERABLE)</text>
    <rect x="732" y="10" width="112" height="22" rx="11" fill="var(--scene-teal-soft)" stroke="var(--scene-teal)" stroke-width="1"/>
    <text x="788" y="25" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--scene-teal)">36.8% MAX</text>

    ${slotCols}
    <line x1="828" y1="38" x2="828" y2="150" stroke="var(--sr-border-strong)" stroke-width="1.5" stroke-dasharray="4 4"/>

    <!-- Slot 1: Clean A -->
    <rect data-part="s1A" x="154" y="62" width="124" height="32" rx="5" fill="var(--scene-teal)" opacity="0"/>
    <text data-part="s1ATxt" x="216" y="82" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">A · OK</text>

    <!-- Slot 2: B waits for boundary then sends cleanly -->
    <rect data-part="s2B" x="290" y="102" width="124" height="32" rx="5" fill="var(--sr-amber)" opacity="0"/>
    <text data-part="s2BTxt" x="352" y="122" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">B WAITED · OK</text>

    <!-- Slot 3: Idle gap -->
    <text data-part="s3Idle" x="488" y="98" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)" opacity="0">IDLE SLOT</text>

    <!-- Slot 4: Simultaneous blind pick -> entire slot lost -->
    <rect data-part="s4Clash" x="562" y="60" width="124" height="76" rx="6" fill="var(--scene-crimson)" opacity="0"/>
    <text data-part="s4Txt1" x="624" y="92" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">A + B SAME TICK</text>
    <text data-part="s4Txt2" x="624" y="112" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">BOTH LOST</text>

    <!-- Slot 5: Clean Recovery -->
    <rect data-part="s5A" x="698" y="62" width="124" height="32" rx="5" fill="var(--scene-teal)" opacity="0"/>
    <text data-part="s5ATxt" x="760" y="82" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)" opacity="0">A RETRY · OK</text>

    <!-- Slot Sweep Beam -->
    <line data-part="beam" x1="148" y1="38" x2="148" y2="156" stroke="var(--sr-amber)" stroke-width="2.5" opacity="0.85"/>
    <text data-part="note" x="20" y="170" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">STATIONS ALIGN TO SLOT TICKS — NO PARTIAL TAIL CLIPS</text>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--scene-teal)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">SLOT 1: STATION A ALIGNS TO CLOCK BOUNDARY</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--scene-teal)">PEAK EFFICIENCY: 36.8%</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch2-p02",
  description: "Comparing Pure ALOHA's 2T vulnerable window (18.4% max) against Slotted ALOHA's discrete clock-tick slots (36.8% max), including a Slot 4 same-tick collision.",
  artwork,
  duration: 9.5,
  still: 5.8,
  draw(parts, time) {
    const beamX = lerp(148, 828, ease(time, 0.2, 8.6));
    parts.beam.setAttribute("x1", beamX.toFixed(1));
    parts.beam.setAttribute("x2", beamX.toFixed(1));

    // Clock pulse on each slot tick (every ~1.68s)
    const tickPhase = (time - 0.2) % 1.68;
    const pulse = tickPhase >= 0 && tickPhase < 0.35 ? 1 : 0.35;
    parts.clkDot.setAttribute("opacity", pulse.toFixed(2));

    const endFade = 1 - ease(time, 8.85, 9.45);
    const v1 = ease(time, 0.35, 0.85) * endFade;
    const v2 = ease(time, 1.95, 2.45) * endFade;
    const v3 = ease(time, 3.6, 4.1) * endFade;
    const v4 = ease(time, 5.25, 5.75) * endFade;
    const v5 = ease(time, 6.95, 7.45) * endFade;

    parts.s1A.setAttribute("opacity", v1.toFixed(2));
    parts.s1ATxt.setAttribute("opacity", v1.toFixed(2));
    parts.s2B.setAttribute("opacity", v2.toFixed(2));
    parts.s2BTxt.setAttribute("opacity", v2.toFixed(2));
    parts.s3Idle.setAttribute("opacity", v3.toFixed(2));
    parts.s4Clash.setAttribute("opacity", v4.toFixed(2));
    parts.s4Txt1.setAttribute("opacity", v4.toFixed(2));
    parts.s4Txt2.setAttribute("opacity", v4.toFixed(2));
    parts.s5A.setAttribute("opacity", v5.toFixed(2));
    parts.s5ATxt.setAttribute("opacity", v5.toFixed(2));

    let status = "SLOT 1: STATION A ALIGNS TO CLOCK BOUNDARY";
    let dot = "var(--scene-teal)";
    let note = "STATIONS ALIGN TO SLOT TICKS — NO PARTIAL TAIL CLIPS";

    if (time >= 1.9 && time < 3.6) {
      status = "SLOT 2: STATION B WAITED FOR TICK · CLEAN SLOT";
      dot = "var(--sr-amber)";
    } else if (time >= 3.6 && time < 5.25) {
      status = "SLOT 3: NO STATION READY · QUIET SLOT";
      dot = "var(--sr-ink-muted)";
    } else if (time >= 5.25 && time < 6.95) {
      status = "SLOT 4: TWO BLIND RADIOS PICK SAME TICK · BOTH LOST";
      dot = "var(--scene-crimson)";
      note = "BLIND RADIOS CANNOT HEAR MID-AIR — SAME TICK STILL COLLIDES";
    } else if (time >= 6.95 && time < 8.85) {
      status = "SLOT 5: BACKOFF SEPARATES RETRY · 36.8% CAP";
      dot = "var(--scene-teal)";
    } else if (time >= 8.85) {
      status = "RESETTING SLOTTED CLOCK…";
      dot = "var(--sr-amber)";
    }

    if (parts.status.textContent !== status) parts.status.textContent = status;
    if (parts.note.textContent !== note) parts.note.textContent = note;
    parts.dot.setAttribute("fill", dot);
  },
});
