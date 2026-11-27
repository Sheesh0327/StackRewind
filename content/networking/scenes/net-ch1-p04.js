import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const pts = [
  [104, 268], // 0: Sender
  [298, 154], // 1: Top-Left
  [298, 382], // 2: Bottom-Left
  [480, 268], // 3: Central Hub
  [662, 154], // 4: Top-Right
  [662, 382], // 5: Bottom-Right
  [856, 268], // 6: Receiver
];

const allLinks = [
  [0, 1], [0, 2], [1, 2],
  [1, 4], [2, 5], [4, 5],
  [4, 6], [5, 6],
];
const hubLinks = [[1, 3], [2, 3], [3, 4], [3, 5]];

function segPath(a, b) {
  return `M${pts[a][0]} ${pts[a][1]} L${pts[b][0]} ${pts[b][1]}`;
}

function routePos(route, progress) {
  const clamped = Math.max(0, Math.min(0.9999, progress));
  const scaled = clamped * (route.length - 1);
  const hop = Math.floor(scaled);
  const frac = scaled - hop;
  const [x1, y1] = pts[route[hop]];
  const [x2, y2] = pts[route[hop + 1]];
  return [lerp(x1, x2, frac), lerp(y1, y2, frac)];
}

const staticWires = allLinks.map(([a, b]) => `<path d="${segPath(a, b)}" class="sc-wire"/>`).join("");
const spokeWires = hubLinks.map(([a, b], i) => `<path data-part="spoke${i}" d="${segPath(a, b)}" class="sc-wire"/>`).join("");
const nodeCircles = pts.map(([x, y], i) => {
  const label = i === 0 ? "SENDER" : i === 6 ? "RECEIVER" : i === 3 ? "HUB" : `N${i}`;
  const yOff = i === 1 || i === 4 ? -32 : 38;
  return `<g transform="translate(${x} ${y})">
    <circle data-part="ring${i}" r="24" fill="none" stroke="var(--sr-amber)" stroke-width="2" opacity="0"/>
    <circle data-part="node${i}" r="18" class="sc-card"/>
    <circle r="5" fill="${i === 0 ? "var(--sr-amber)" : i === 6 ? "var(--scene-teal)" : "var(--sr-ink-secondary)"}"/>
    <text y="${yOff}" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">${label}</text>
  </g>`;
}).join("");

const artwork = `
  <defs>
    <pattern id="p04-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#p04-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1960–1964 · RAND DISTRIBUTED MESH</text>
  <text x="48" y="88" class="sc-title" font-size="30">Blocks route around damage</text>

  <!-- 1,024-bit Message Blocks Badge -->
  <g transform="translate(692 38)">
    <rect width="220" height="32" rx="16" class="sc-card"/>
    <text x="110" y="20" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">1,024-BIT MESSAGE BLOCKS</text>
  </g>

  ${staticWires}
  ${spokeWires}

  <!-- Highlighted Route Traces -->
  <path data-part="routeCenter" d="M104 268 L298 154 L480 268 L662 154 L856 268" fill="none" stroke="var(--sr-amber)" stroke-width="2.5" stroke-dasharray="6 6" opacity="0"/>
  <path data-part="routeTop" d="M104 268 L298 154 L662 154 L856 268" fill="none" stroke="var(--sr-amber)" stroke-width="2.5" stroke-dasharray="6 6" opacity="0"/>
  <path data-part="routeBot" d="M104 268 L298 382 L662 382 L856 268" fill="none" stroke="var(--scene-teal)" stroke-width="2.5" stroke-dasharray="6 6" opacity="0"/>

  ${nodeCircles}

  <!-- Hub Blast & Offline Pill -->
  <circle data-part="blast" cx="480" cy="268" r="20" fill="none" stroke="var(--scene-crimson)" stroke-width="3" opacity="0"/>
  <g data-part="hubDown" transform="translate(480 220)" opacity="0">
    <rect x="-48" y="-12" width="96" height="22" rx="11" fill="var(--scene-crimson-soft)" stroke="var(--scene-crimson)" stroke-width="1.2"/>
    <text x="0" y="3" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--scene-crimson)">HUB OFFLINE</text>
  </g>

  <!-- Moving Message Blocks (#1 Center, #2 Top Detour, #3 Bottom Detour) -->
  <g data-part="blk1" opacity="0">
    <rect x="-14" y="-10" width="28" height="20" rx="4" fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
    <text y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">#1</text>
  </g>
  <g data-part="blk2" opacity="0">
    <rect x="-14" y="-10" width="28" height="20" rx="4" fill="var(--sr-amber)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
    <text y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">#2</text>
  </g>
  <g data-part="blk3" opacity="0">
    <rect x="-14" y="-10" width="28" height="20" rx="4" fill="var(--scene-teal)" stroke="var(--sr-bg-canvas)" stroke-width="2"/>
    <text y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">#3</text>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--sr-amber)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">HOT-POTATO ROUTING · ALL LINKS UP</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--sr-amber)">DELIVERED: 0 / 3</text>
  </g>
`;

const routeCenter = [0, 1, 3, 4, 6];
const routeTop = [0, 1, 4, 6];
const routeBot = [0, 2, 5, 6];

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch1-p04",
  description: "Paul Baran's distributed mesh routes message block #1 through the central hub. When the hub goes offline, blocks #2 and #3 automatically detour via upper and lower perimeter routes.",
  artwork,
  duration: 9.5,
  still: 6.0,
  draw(parts, time) {
    const hubFail = ease(time, 2.75, 3.3) - ease(time, 8.1, 9.1);
    const blastFade = windowPulse(time, 2.75, 3.15, 4.2);

    // Hub spokes fade/dash when offline
    for (let i = 0; i < 4; i++) {
      const sp = parts[`spoke${i}`];
      sp.setAttribute("opacity", (1 - 0.78 * hubFail).toFixed(2));
      sp.setAttribute("stroke-dasharray", hubFail > 0.3 ? "4 6" : "none");
    }
    parts.node3.setAttribute("stroke", hubFail > 0.4 ? "var(--scene-crimson)" : "var(--sr-border-strong)");
    parts.hubDown.setAttribute("opacity", hubFail.toFixed(2));
    parts.blast.setAttribute("r", (20 + 68 * ease(time, 2.75, 4.0)).toFixed(1));
    parts.blast.setAttribute("opacity", blastFade.toFixed(2));

    // Block #1 via center hub (0.3s -> 2.5s)
    const p1 = (time - 0.3) / 2.2;
    if (p1 > 0 && p1 < 1) {
      const [x, y] = routePos(routeCenter, p1);
      parts.blk1.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      parts.blk1.setAttribute("opacity", Math.min(1, p1 * 12, (1 - p1) * 12).toFixed(2));
      parts.routeCenter.setAttribute("opacity", "0.55");
    } else {
      parts.blk1.setAttribute("opacity", "0");
      parts.routeCenter.setAttribute("opacity", "0");
    }

    // Block #2 upper detour (3.8s -> 6.8s)
    const p2 = (time - 3.8) / 3.0;
    if (p2 > 0 && p2 < 1) {
      const [x, y] = routePos(routeTop, p2);
      parts.blk2.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      parts.blk2.setAttribute("opacity", Math.min(1, p2 * 12, (1 - p2) * 12).toFixed(2));
      parts.routeTop.setAttribute("opacity", "0.75");
    } else {
      parts.blk2.setAttribute("opacity", "0");
      parts.routeTop.setAttribute("opacity", windowPulse(time, 3.6, 5.2, 7.6).toFixed(2));
    }

    // Block #3 lower detour (4.3s -> 7.3s)
    const p3 = (time - 4.3) / 3.0;
    if (p3 > 0 && p3 < 1) {
      const [x, y] = routePos(routeBot, p3);
      parts.blk3.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      parts.blk3.setAttribute("opacity", Math.min(1, p3 * 12, (1 - p3) * 12).toFixed(2));
      parts.routeBot.setAttribute("opacity", "0.75");
    } else {
      parts.blk3.setAttribute("opacity", "0");
      parts.routeBot.setAttribute("opacity", windowPulse(time, 4.1, 5.6, 7.8).toFixed(2));
    }

    // Delivered counter & status text
    let delivered = 0;
    if (time >= 2.45) delivered = 1;
    if (time >= 6.75) delivered = 2;
    if (time >= 7.25) delivered = 3;
    if (time >= 8.7) delivered = 0;

    let status = "HOT-POTATO ROUTING · HUB ONLINE";
    let dotColor = "var(--sr-amber)";
    if (time >= 2.75 && time < 3.8) {
      status = "CENTRAL HUB DESTROYED · LINKS SEVERED";
      dotColor = "var(--scene-crimson)";
    } else if (time >= 3.8 && time < 8.1) {
      status = "DETOURING ALONG SURVIVING OUTER LINKS";
      dotColor = "var(--scene-teal)";
    } else if (time >= 8.1) {
      status = "RESETTING MESH SIMULATION…";
    }
    if (parts.status.textContent !== status) parts.status.textContent = status;
    parts.dot.setAttribute("fill", dotColor);
    const tallyText = `DELIVERED: ${delivered} / 3`;
    if (parts.tally.textContent !== tallyText) parts.tally.textContent = tallyText;
  },
});
