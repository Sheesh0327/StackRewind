import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

function terminal(x, y, name, accent = "var(--sr-amber)") {
  return `<g transform="translate(${x} ${y})">
    <rect x="-60" y="-44" width="120" height="84" rx="10" class="sc-card"/>
    <rect x="-46" y="-30" width="92" height="46" rx="5" class="sc-panel"/>
    <path d="M-28 -7 H-14 L-6 -20 L2 6 L10 -12 H28" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="0" y="30" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink)">${name}</text>
  </g>`;
}

function exchange(x, num) {
  return `<g transform="translate(${x} 214)">
    <rect data-part="exBox${num}" x="-50" y="-36" width="100" height="72" rx="10" class="sc-card"/>
    <circle cx="-24" cy="0" r="4" fill="var(--sr-ink-muted)"/>
    <circle cx="24" cy="0" r="4" fill="var(--sr-ink-muted)"/>
    <line data-part="exArm${num}" x1="-24" y1="0" x2="24" y2="0" stroke="var(--sr-amber)" stroke-width="3.5" stroke-linecap="round"/>
    <text x="0" y="56" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">EXCHANGE ${num}</text>
  </g>`;
}

const artwork = `
  <defs>
    <pattern id="p03-grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M30 0H0V30" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#p03-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">CIRCUIT SWITCHING · SINGLE-POINT FRAGILITY</text>
  <text x="48" y="88" class="sc-title" font-size="30">One call holds the copper path</text>

  <!-- Secondary link from Computer C up to Exchange 1 -->
  <path d="M295 360 V250" class="sc-wire" stroke-dasharray="5 5"/>
  <circle data-part="cProbe" cx="295" cy="355" r="7" fill="var(--scene-teal)" opacity="0"/>
  <circle data-part="busyRing" cx="295" cy="252" r="10" fill="none" stroke="var(--scene-teal)" stroke-width="2.5" opacity="0"/>
  <text data-part="busyText" x="342" y="316" class="sc-mono" font-size="11" fill="var(--scene-teal)" opacity="0">BUSY · LINE LOCKED</text>

  <!-- Main End-to-End Trunk -->
  <path d="M160 214 H800" class="sc-wire"/>
  <path data-part="trunk" d="M160 214 H800" class="sc-amber-wire" pathLength="1"/>

  ${terminal(102, 214, "COMPUTER A")}
  ${terminal(858, 214, "COMPUTER B")}
  ${terminal(295, 404, "COMPUTER C", "var(--scene-teal)")}

  ${exchange(295, 1)}
  ${exchange(480, 2)}
  ${exchange(665, 3)}

  <!-- Data Pulse A -> B -->
  <rect data-part="pulse" y="205" width="24" height="18" rx="5" fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>

  <!-- Exchange 2 Fault Ripple & Cross -->
  <circle data-part="faultRing" cx="480" cy="214" r="18" fill="none" stroke="var(--scene-crimson)" stroke-width="3" opacity="0"/>
  <g data-part="faultCross" transform="translate(480 128)" opacity="0">
    <rect x="-64" y="-14" width="128" height="24" rx="12" fill="var(--scene-crimson-soft)" stroke="var(--scene-crimson)" stroke-width="1.2"/>
    <text x="0" y="2" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--scene-crimson)">EXCHANGE 2 DOWN</text>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(460 444)">
    <rect width="452" height="54" rx="10" class="sc-card"/>
    <circle data-part="statusDot" cx="24" cy="27" r="5" fill="var(--sr-amber)"/>
    <text data-part="statusText" x="42" y="31" class="sc-mono" font-size="12" fill="var(--sr-ink)">CIRCUIT RESERVED END TO END</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch1-p03",
  description: "Two computers lock a circuit across three exchanges. A third caller is blocked during silence, and a fault at Exchange 2 drops the entire call.",
  artwork,
  duration: 9.5,
  still: 6.4,
  draw(parts, time) {
    const reserved = ease(time, 0.2, 0.9) - ease(time, 5.4, 5.7);
    const faulted = windowPulse(time, 5.3, 6.2, 8.7);
    const ex2Break = ease(time, 5.35, 5.8) - ease(time, 8.2, 8.9);

    // Trunk reservation
    parts.trunk.setAttribute("stroke-dasharray", `${clampVal(reserved).toFixed(3)} 1`);
    parts.trunk.setAttribute("opacity", (0.15 + 0.85 * Math.max(0, reserved)).toFixed(2));

    // Exchange switches
    [1, 2, 3].forEach((n) => {
      const arm = parts[`exArm${n}`];
      const box = parts[`exBox${n}`];
      if (n === 2 && ex2Break > 0.05) {
        const lift = -20 * ex2Break;
        arm.setAttribute("x2", (24 - 10 * ex2Break).toFixed(1));
        arm.setAttribute("y2", lift.toFixed(1));
        arm.setAttribute("stroke", "var(--scene-crimson)");
        box.setAttribute("stroke", "var(--scene-crimson)");
      } else {
        const closed = ease(time, 0.2 + (n - 1) * 0.12, 0.7 + (n - 1) * 0.12) - ease(time, 8.8, 9.4);
        arm.setAttribute("x2", "24");
        arm.setAttribute("y2", lerp(-16, 0, Math.max(0, closed)).toFixed(1));
        arm.setAttribute("stroke", "var(--sr-amber)");
        box.setAttribute("stroke", "var(--sr-border-strong)");
      }
    });

    // Pulse A -> B during active send (1.0s -> 2.8s)
    const pulseProg = (time - 1.0) / 1.7;
    if (pulseProg > 0 && pulseProg < 1) {
      parts.pulse.setAttribute("x", lerp(170, 772, pulseProg).toFixed(1));
      parts.pulse.setAttribute("opacity", Math.min(1, pulseProg * 10, (1 - pulseProg) * 10).toFixed(2));
    } else {
      parts.pulse.setAttribute("opacity", "0");
    }

    // Computer C dial attempt during silence (3.1s -> 4.9s)
    const cMove = windowPulse(time, 3.0, 3.8, 4.9);
    parts.cProbe.setAttribute("cy", lerp(355, 260, cMove).toFixed(1));
    parts.cProbe.setAttribute("opacity", (cMove > 0.02 ? 1 : 0).toString());
    const busyPing = windowPulse(time, 3.65, 4.05, 4.75);
    parts.busyRing.setAttribute("r", (10 + 26 * ease(time, 3.65, 4.65)).toFixed(1));
    parts.busyRing.setAttribute("opacity", busyPing.toFixed(2));
    parts.busyText.setAttribute("opacity", windowPulse(time, 3.55, 3.9, 5.0).toFixed(2));

    // Exchange 2 fault ring & banner
    const ringGrow = ease(time, 5.4, 6.7);
    parts.faultRing.setAttribute("r", (18 + 38 * ringGrow).toFixed(1));
    parts.faultRing.setAttribute("opacity", (windowPulse(time, 5.35, 5.8, 7.1)).toFixed(2));
    parts.faultCross.setAttribute("opacity", faulted.toFixed(2));

    // Status strip
    let status = "CIRCUIT RESERVED · SENDING DATA";
    let color = "var(--sr-amber)";
    if (time < 0.9) status = "CLOSING SWITCHES END TO END…";
    else if (time >= 2.8 && time < 5.3) status = "SILENT · CIRCUIT STILL LOCKED (C BLOCKED)";
    else if (time >= 5.3 && time < 8.6) {
      status = "EXCHANGE 2 OFFLINE · CALL DROPPED";
      color = "var(--scene-crimson)";
    } else if (time >= 8.6) {
      status = "RESTORING TRUNK…";
    }
    if (parts.statusText.textContent !== status) parts.statusText.textContent = status;
    parts.statusDot.setAttribute("fill", color);
    parts.statusText.setAttribute("fill", color === "var(--scene-crimson)" ? "var(--scene-crimson)" : "var(--sr-ink)");
  },
});

function clampVal(v) {
  return Math.max(0, Math.min(1, v));
}
