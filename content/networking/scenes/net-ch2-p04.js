import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const artwork = `
  <defs>
    <pattern id="net2-p04-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#net2-p04-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">ETHERNET CONTENTION RESOLUTION · UP TO 1,023 SLOTS</text>
  <text x="48" y="88" class="sc-title" font-size="30">Binary Exponential Backoff breaks the tie</text>

  <g transform="translate(700 38)">
    <rect width="212" height="32" rx="16" class="sc-card"/>
    <text data-part="utilBadge" x="106" y="20" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--scene-teal)">LINK UTILIZATION · 84%</text>
  </g>

  <!-- Host A Card -->
  <g transform="translate(48 116)">
    <rect width="224" height="142" rx="12" class="sc-card"/>
    <circle cx="22" cy="26" r="5" fill="var(--sr-amber)"/>
    <text x="36" y="30" class="sc-mono" font-size="12" fill="var(--sr-ink)">HOST A</text>
    <text data-part="aPick" x="20" y="66" class="sc-title" font-size="18">WAIT: 0 SLOTS</text>
    <text data-part="aSub" x="20" y="96" class="sc-mono" font-size="11" fill="var(--sr-amber)">CLASH #1 · ROLL {0, 1}</text>
    <rect x="20" y="112" width="184" height="10" rx="5" class="sc-panel"/>
    <rect data-part="aBar" x="20" y="112" width="0" height="10" rx="5" fill="var(--sr-amber)"/>
  </g>

  <!-- Contention Window Ladder -->
  <g transform="translate(292 116)">
    <rect width="376" height="142" rx="12" class="sc-card"/>
    <text x="20" y="26" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">CONTENTION WINDOW DOUBLING (0 TO 2^K − 1)</text>

    <!-- Row k=1 -->
    <g transform="translate(20 42)">
      <rect data-part="r1" width="336" height="24" rx="5" class="sc-panel"/>
      <text x="12" y="16" class="sc-mono" font-size="11" fill="var(--sr-ink)">k=1</text>
      <text x="64" y="16" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">[ 0 , 1 ]</text>
      <text data-part="r1Tag" x="324" y="16" text-anchor="end" class="sc-mono" font-size="10" fill="var(--scene-crimson)">A=0, B=0 → TIE!</text>
    </g>

    <!-- Row k=2 -->
    <g transform="translate(20 72)">
      <rect data-part="r2" width="336" height="24" rx="5" class="sc-panel"/>
      <text x="12" y="16" class="sc-mono" font-size="10.5" fill="var(--sr-ink)">k=2</text>
      <text x="56" y="16" class="sc-mono" font-size="10.5" fill="var(--sr-ink-secondary)">[0, 1, 2, 3]</text>
      <text data-part="r2Tag" x="324" y="16" text-anchor="end" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">NEXT: ×2 WINDOW</text>
    </g>

    <!-- Row k=3..10 -->
    <g transform="translate(20 102)">
      <rect width="336" height="24" rx="5" class="sc-panel"/>
      <text x="12" y="16" class="sc-mono" font-size="10.5" fill="var(--sr-ink-muted)">k=3..10</text>
      <text x="76" y="16" class="sc-mono" font-size="10.5" fill="var(--sr-ink-muted)">[0..7] → [0..1,023]</text>
      <text x="324" y="16" text-anchor="end" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">CAP 16 TRIES</text>
    </g>
  </g>

  <!-- Host B Card -->
  <g transform="translate(688 116)">
    <rect width="224" height="142" rx="12" class="sc-card"/>
    <circle cx="22" cy="26" r="5" fill="var(--scene-teal)"/>
    <text x="36" y="30" class="sc-mono" font-size="12" fill="var(--sr-ink)">HOST B</text>
    <text data-part="bPick" x="20" y="66" class="sc-title" font-size="18">WAIT: 0 SLOTS</text>
    <text data-part="bSub" x="20" y="96" class="sc-mono" font-size="11" fill="var(--scene-teal)">CLASH #1 · ROLL {0, 1}</text>
    <rect x="20" y="112" width="184" height="10" rx="5" class="sc-panel"/>
    <rect data-part="bBar" x="20" y="112" width="0" height="10" rx="5" fill="var(--scene-teal)"/>
  </g>

  <!-- Shared Wire & Slot Sequence Card -->
  <g transform="translate(48 278)">
    <rect width="864" height="162" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">SHARED WIRE TIMELINE · SELF-TUNING SPREAD WITHOUT A MASTER CLOCK</text>

    <line x1="28" y1="92" x2="836" y2="92" stroke="var(--sr-border-strong)" stroke-width="6" stroke-linecap="round"/>

    <!-- Slot Markers 0..3 -->
    <g transform="translate(180 48)">
      <line x1="0" y1="10" x2="0" y2="78" stroke="var(--sr-border-strong)" stroke-dasharray="4 4"/>
      <text x="0" y="102" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">SLOT 0</text>
    </g>
    <g transform="translate(360 48)">
      <line x1="0" y1="10" x2="0" y2="78" stroke="var(--sr-border-strong)" stroke-dasharray="4 4"/>
      <text x="0" y="102" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">SLOT 1</text>
    </g>
    <g transform="translate(540 48)">
      <line x1="0" y1="10" x2="0" y2="78" stroke="var(--sr-border-strong)" stroke-dasharray="4 4"/>
      <text x="0" y="102" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">SLOT 2</text>
    </g>
    <g transform="translate(720 48)">
      <line x1="0" y1="10" x2="0" y2="78" stroke="var(--sr-border-strong)" stroke-dasharray="4 4"/>
      <text x="0" y="102" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">SLOT 3</text>
    </g>

    <!-- Slot 0 Collision -->
    <g data-part="clash0" opacity="0">
      <rect x="136" y="64" width="88" height="52" rx="6" fill="var(--scene-crimson)"/>
      <text x="180" y="88" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="var(--scene-paper-ink)">A + B</text>
      <text x="180" y="105" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">LOCKSTEP!</text>
    </g>

    <!-- Slot 1: Host A Wins -->
    <g data-part="winA" opacity="0">
      <rect x="308" y="68" width="144" height="44" rx="6" fill="var(--sr-amber)"/>
      <text x="380" y="95" text-anchor="middle" class="sc-mono" font-size="12" font-weight="700" fill="var(--scene-paper-ink)">HOST A · CLEAR</text>
    </g>

    <!-- Slot 3: Host B Follows -->
    <g data-part="winB" opacity="0">
      <rect x="658" y="68" width="144" height="44" rx="6" fill="var(--scene-teal)"/>
      <text x="730" y="95" text-anchor="middle" class="sc-mono" font-size="12" font-weight="700" fill="var(--scene-paper-ink)">HOST B · CLEAR</text>
    </g>

    <line data-part="sweep" x1="80" y1="48" x2="80" y2="132" stroke="var(--sr-amber)" stroke-width="2" opacity="0.8"/>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--scene-crimson)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">CLASH #1: BOTH PICKED 0 · LOCKSTEP COLLISION</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--sr-amber)">WINDOW: [0, 1]</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch2-p04",
  description: "Two hosts collide at k=1 after both pick 0 slots. Ethernet doubles the contention window to [0..3], letting Host A transmit cleanly on Slot 1 and Host B follow on Slot 3.",
  artwork,
  duration: 10.0,
  still: 6.2,
  draw(parts, time) {
    const endFade = 1 - ease(time, 9.25, 9.95);
    const sweepX = lerp(90, 820, ease(time, 0.3, 9.0));
    parts.sweep.setAttribute("x1", sweepX.toFixed(1));
    parts.sweep.setAttribute("x2", sweepX.toFixed(1));

    const c0 = ease(time, 0.4, 0.9) * endFade;
    const wA = ease(time, 4.4, 4.9) * endFade;
    const wB = ease(time, 6.8, 7.3) * endFade;

    parts.clash0.setAttribute("opacity", c0.toFixed(2));
    parts.winA.setAttribute("opacity", wA.toFixed(2));
    parts.winB.setAttribute("opacity", wB.toFixed(2));

    let aPick = "WAIT: 0 SLOTS";
    let bPick = "WAIT: 0 SLOTS";
    let aSub = "CLASH #1 · ROLL {0, 1}";
    let bSub = "CLASH #1 · ROLL {0, 1}";
    let r1Stroke = "var(--scene-crimson)";
    let r2Stroke = "var(--sr-border)";
    let r2Tag = "NEXT: ×2 WINDOW";
    let r2TagColor = "var(--sr-ink-muted)";
    let status = "CLASH #1: BOTH PICKED 0 · LOCKSTEP COLLISION";
    let tally = "WINDOW: [0, 1]";
    let dot = "var(--scene-crimson)";
    let aFill = 0;
    let bFill = 0;

    if (time >= 2.2 && time < 4.4) {
      aPick = "WAIT: 1 SLOT";
      bPick = "WAIT: 3 SLOTS";
      aSub = "CLASH #2 · ROLL {0..3}";
      bSub = "CLASH #2 · ROLL {0..3}";
      r1Stroke = "var(--sr-border)";
      r2Stroke = "var(--sr-amber)";
      r2Tag = "A=1, B=3 · SPLIT";
      r2TagColor = "var(--scene-teal)";
      status = "CLASH #2: WINDOW DOUBLES TO [0..3] · TIMERS DIVERGE";
      tally = "WINDOW: [0..3]";
      dot = "var(--sr-amber)";
      aFill = lerp(184, 0, ease(time, 2.4, 4.3));
      bFill = lerp(184, 92, ease(time, 2.4, 4.3));
    } else if (time >= 4.4 && time < 6.8) {
      aPick = "TX CLEAN · OK";
      bPick = "WAITING (2T)";
      aSub = "SLOT 1 CLAIMED";
      bSub = "2 SLOTS LEFT";
      r1Stroke = "var(--sr-border)";
      r2Stroke = "var(--scene-teal)";
      r2Tag = "A=1, B=3 · SPLIT";
      r2TagColor = "var(--scene-teal)";
      status = "HOST A CLAIMS QUIET WIRE ON SLOT 1";
      tally = "UTILIZATION: >80%";
      dot = "var(--scene-teal)";
      aFill = 184;
      bFill = lerp(92, 0, ease(time, 4.4, 6.7));
    } else if (time >= 6.8 && time < 9.25) {
      aPick = "IDLE · DONE";
      bPick = "TX CLEAN · OK";
      aSub = "FRAME DELIVERED";
      bSub = "SLOT 3 CLAIMED";
      r1Stroke = "var(--sr-border)";
      r2Stroke = "var(--scene-teal)";
      r2Tag = "A=1, B=3 · SPLIT";
      r2TagColor = "var(--scene-teal)";
      status = "HOST B FOLLOWS ON SLOT 3 · ZERO COLLISION";
      tally = "UTILIZATION: 84%";
      dot = "var(--scene-teal)";
      aFill = 184;
      bFill = 184;
    } else if (time >= 9.25) {
      status = "RESETTING BACKOFF SIMULATION…";
      dot = "var(--sr-amber)";
    }

    if (parts.aPick.textContent !== aPick) parts.aPick.textContent = aPick;
    if (parts.bPick.textContent !== bPick) parts.bPick.textContent = bPick;
    if (parts.aSub.textContent !== aSub) parts.aSub.textContent = aSub;
    if (parts.bSub.textContent !== bSub) parts.bSub.textContent = bSub;
    parts.r1.setAttribute("stroke", r1Stroke);
    parts.r2.setAttribute("stroke", r2Stroke);
    if (parts.r2Tag.textContent !== r2Tag) parts.r2Tag.textContent = r2Tag;
    parts.r2Tag.setAttribute("fill", r2TagColor);
    parts.aBar.setAttribute("width", aFill.toFixed(1));
    parts.bBar.setAttribute("width", bFill.toFixed(1));
    if (parts.status.textContent !== status) parts.status.textContent = status;
    if (parts.tally.textContent !== tally) parts.tally.textContent = tally;
    parts.dot.setAttribute("fill", dot);
  },
});
