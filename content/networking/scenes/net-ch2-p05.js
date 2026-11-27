import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";

const fields = [
  { x: 20, w: 124, label: "PREAMBLE+SFD", bytes: "8B", color: "var(--sr-ink-secondary)" },
  { x: 150, w: 126, label: "DST MAC", bytes: "6B (48b)", color: "var(--sr-amber)" },
  { x: 282, w: 126, label: "SRC MAC", bytes: "6B (48b)", color: "var(--sr-amber)" },
  { x: 414, w: 98, label: "TYPE / LEN", bytes: "2B", color: "var(--sr-ink)" },
  { x: 518, w: 214, label: "PAYLOAD + PAD", bytes: "46–1500B", color: "var(--scene-teal)" },
  { x: 738, w: 106, label: "CRC-32 FCS", bytes: "4B", color: "var(--scene-teal)" },
];

const fieldBoxes = fields.map((f, i) => `
  <g transform="translate(${f.x} 40)">
    <rect data-part="fBox${i}" width="${f.w}" height="64" rx="6" class="sc-panel" stroke="${f.color}"/>
    <text x="${f.w / 2}" y="27" text-anchor="middle" class="sc-mono" font-size="11" font-weight="700" fill="${f.color}">${f.label}</text>
    <text x="${f.w / 2}" y="48" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-ink-muted)">${f.bytes}</text>
  </g>
`).join("");

const artwork = `
  <defs>
    <pattern id="net2-p05-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="var(--sr-border)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="960" height="540" fill="var(--sr-bg-surface)"/>
  <rect width="960" height="540" fill="url(#net2-p05-grid)" opacity="0.55"/>

  <text x="48" y="54" class="sc-mono" font-size="13" fill="var(--sr-amber)">1980 DIX · 1983 IEEE 802.3 · HARDWARE FRAMING</text>
  <text x="48" y="88" class="sc-title" font-size="30">Ethernet Frames filter noise in silicon</text>

  <g transform="translate(700 38)">
    <rect width="212" height="32" rx="16" class="sc-card"/>
    <text x="106" y="20" text-anchor="middle" class="sc-mono" font-size="11" fill="var(--sr-amber)">48-BIT HARDWARE MAC</text>
  </g>

  <!-- Frame Anatomy Blueprint -->
  <g transform="translate(48 112)">
    <rect width="864" height="154" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">ETHERNET FRAME ANATOMY (DST = BB:34 · SRC = AA:10)</text>

    ${fieldBoxes}

    <!-- Explicit >=64B Min Frame Bracket spanning DST MAC .. CRC-32 FCS -->
    <path d="M150 112 V122 H844 V112" fill="none" stroke="var(--sr-amber)" stroke-width="1.6"/>
    <line x1="497" y1="122" x2="497" y2="128" stroke="var(--sr-amber)" stroke-width="1.6"/>
    <text x="497" y="142" text-anchor="middle" class="sc-mono" font-size="10" fill="var(--sr-amber)">≥64B MIN FRAME (512 BITS · DST MAC THROUGH CRC-32 FCS)</text>

    <!-- Field Inspector Cursor -->
    <rect data-part="scan" x="20" y="38" width="124" height="68" rx="7" fill="none" stroke="var(--sr-ink)" stroke-width="2" opacity="0.85"/>
  </g>

  <!-- Broadcast Bus -> 3 NIC Silicon Filter Cards -->
  <g transform="translate(48 286)">
    <rect width="864" height="154" rx="12" class="sc-card"/>
    <text x="20" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink-secondary)">SHARED BROADCAST WIRE → SILICON MAC FILTERING</text>

    <!-- Incoming bus line -->
    <line x1="150" y1="44" x2="714" y2="44" class="sc-wire"/>
    <line x1="150" y1="44" x2="150" y2="62" class="sc-wire"/>
    <line x1="432" y1="44" x2="432" y2="62" class="sc-wire"/>
    <line x1="714" y1="44" x2="714" y2="62" class="sc-wire"/>

    <!-- Flying DST=BB:34 pulse -->
    <g data-part="fly" opacity="0">
      <rect x="-42" y="-11" width="84" height="22" rx="11" fill="var(--sr-amber)"/>
      <text y="4" text-anchor="middle" class="sc-mono" font-size="10" font-weight="700" fill="var(--scene-paper-ink)">DST: BB:34</text>
    </g>

    <!-- NIC 1: AA:12 -->
    <g transform="translate(36 62)">
      <rect data-part="nic1" width="228" height="74" rx="8" class="sc-panel"/>
      <text x="16" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink)">NIC 1 · MAC AA:12</text>
      <text data-part="nic1St" x="16" y="52" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">LISTENING…</text>
    </g>

    <!-- NIC 2: BB:34 (Match) -->
    <g transform="translate(318 62)">
      <rect data-part="nic2" width="228" height="74" rx="8" class="sc-panel"/>
      <text x="16" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink)">NIC 2 · MAC BB:34</text>
      <text data-part="nic2St" x="16" y="52" class="sc-mono" font-size="11" fill="var(--scene-teal)">LISTENING…</text>
    </g>

    <!-- NIC 3: CC:9F -->
    <g transform="translate(600 62)">
      <rect data-part="nic3" width="228" height="74" rx="8" class="sc-panel"/>
      <text x="16" y="24" class="sc-mono" font-size="11" fill="var(--sr-ink)">NIC 3 · MAC CC:9F</text>
      <text data-part="nic3St" x="16" y="52" class="sc-mono" font-size="11" fill="var(--sr-ink-muted)">LISTENING…</text>
    </g>
  </g>

  <!-- Bottom Status Strip -->
  <g transform="translate(48 456)">
    <rect width="864" height="48" rx="10" class="sc-card"/>
    <circle data-part="dot" cx="22" cy="24" r="5" fill="var(--sr-amber)"/>
    <text data-part="status" x="38" y="28" class="sc-mono" font-size="12" fill="var(--sr-ink)">PREAMBLE SYNCS RECEIVER CLOCKS BEFORE DATA</text>
    <text data-part="tally" x="842" y="28" text-anchor="end" class="sc-mono" font-size="12" fill="var(--scene-teal)">CRC-32 + 64B MIN</text>
  </g>
`;

export const { mount, unmount, pause, resume, replay } = createLoopingScene({
  id: "net-ch2-p05",
  description: "Annotated Ethernet Frame anatomy with 64-byte minimum span from DST MAC through CRC-32 FCS, plus three NIC cards filtering a broadcast frame in hardware.",
  artwork,
  duration: 9.5,
  still: 4.8,
  draw(parts, time) {
    // Scan across the 6 frame fields over 0.3..5.5s
    const fieldIdx = Math.min(5, Math.max(0, Math.floor((time - 0.3) / 0.88)));
    const f = fields[fieldIdx];
    parts.scan.setAttribute("x", String(f.x));
    parts.scan.setAttribute("width", String(f.w));
    parts.scan.setAttribute("opacity", (1 - ease(time, 8.9, 9.45)).toFixed(2));

    // Broadcast packet sweeps across wire 4.2..7.0s
    const pFly = (time - 4.2) / 2.4;
    if (pFly > 0 && pFly < 1) {
      parts.fly.setAttribute("transform", `translate(${lerp(150, 714, pFly).toFixed(1)} 44)`);
      parts.fly.setAttribute("opacity", Math.min(1, pFly * 8, (1 - pFly) * 8).toFixed(2));
    } else {
      parts.fly.setAttribute("opacity", "0");
    }

    let n1 = "LISTENING…";
    let n2 = "LISTENING…";
    let n3 = "LISTENING…";
    let n2Stroke = "var(--sr-border)";
    let status = "PREAMBLE (8B) SYNCS RECEIVER BIT CLOCK";
    let dot = "var(--sr-amber)";

    if (time >= 1.18 && time < 2.94) {
      status = "48-BIT DST & SRC MAC IDENTIFY LOCAL CARDS";
    } else if (time >= 2.94 && time < 4.7) {
      status = "TYPE/LEN + PAYLOAD PADDED TO ≥64 BYTES (512 BITS)";
      dot = "var(--scene-teal)";
    } else if (time >= 4.7 && time < 6.4) {
      n1 = "DROP · NO MATCH";
      n2 = "MAC MATCH! CHECKING CRC…";
      n3 = "LISTENING…";
      n2Stroke = "var(--sr-amber)";
      status = "UNMATCHED NICS DROP FRAMES WITHOUT WAKING CPU";
      dot = "var(--sr-amber)";
    } else if (time >= 6.4 && time < 8.85) {
      n1 = "DROP · NO MATCH";
      n2 = "CRC OK → DELIVER TO CPU";
      n3 = "DROP · NO MATCH";
      n2Stroke = "var(--scene-teal)";
      status = "NIC 2 VERIFIES CRC-32 FCS AND DELIVERS PAYLOAD";
      dot = "var(--scene-teal)";
    } else if (time >= 8.85) {
      status = "RESETTING FRAME INSPECTOR…";
      dot = "var(--sr-amber)";
    }

    if (parts.nic1St.textContent !== n1) parts.nic1St.textContent = n1;
    if (parts.nic2St.textContent !== n2) parts.nic2St.textContent = n2;
    if (parts.nic3St.textContent !== n3) parts.nic3St.textContent = n3;
    parts.nic2.setAttribute("stroke", n2Stroke);
    if (parts.status.textContent !== status) parts.status.textContent = status;
    parts.dot.setAttribute("fill", dot);
  },
});
