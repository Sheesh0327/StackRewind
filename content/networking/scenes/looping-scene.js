export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function ease(time, start, end) {
  if (end <= start) return time >= end ? 1 : 0;
  const progress = clamp((time - start) / (end - start), 0, 1);
  return progress * progress * (3 - 2 * progress);
}

export function windowPulse(time, start, peak, end) {
  if (time <= start || time >= end) return 0;
  return time <= peak
    ? ease(time, start, peak)
    : 1 - ease(time, peak, end);
}

export function createLoopingScene({ id, description, artwork, duration, still, draw }) {
  let active;

  function unmount() {
    active?.pause();
    active?.root.remove();
    active = undefined;
  }

  function mount(stageEl) {
    unmount();
    const root = document.createElement("div");
    root.dataset.scene = id;
    root.style.cssText = "position:relative;width:100%;height:100%";
    root.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="100%" height="100%"
           role="img" aria-label="${description}" font-family="var(--sr-font-sans, system-ui)">
        <style>
          [data-scene="${id}"] {
            --scene-teal: #0f766e;
            --scene-teal-soft: rgba(15, 118, 110, 0.14);
            --scene-crimson: #b91c1c;
            --scene-crimson-soft: rgba(185, 28, 28, 0.14);
            --scene-paper-ink: #ffffff;
          }
          @media (prefers-color-scheme: dark) {
            [data-scene="${id}"]:not(:root:has(> head > meta[name="color-scheme"][content="light"]) *) {
              --scene-teal: #4fd1c5;
              --scene-teal-soft: rgba(79, 209, 197, 0.15);
              --scene-crimson: #ef5350;
              --scene-crimson-soft: rgba(239, 83, 80, 0.16);
              --scene-paper-ink: #14100b;
            }
          }
          :root:has(> head > meta[name="color-scheme"][content="dark"]) [data-scene="${id}"] {
            --scene-teal: #4fd1c5;
            --scene-teal-soft: rgba(79, 209, 197, 0.15);
            --scene-crimson: #ef5350;
            --scene-crimson-soft: rgba(239, 83, 80, 0.16);
            --scene-paper-ink: #14100b;
          }
          :root:has(> head > meta[name="color-scheme"][content="light"]) [data-scene="${id}"] {
            --scene-teal: #0f766e;
            --scene-teal-soft: rgba(15, 118, 110, 0.14);
            --scene-crimson: #b91c1c;
            --scene-crimson-soft: rgba(185, 28, 28, 0.14);
            --scene-paper-ink: #ffffff;
          }
          @supports (color: light-dark(white, black)) {
            [data-scene="${id}"] {
              --scene-teal: light-dark(#0f766e, #4fd1c5);
              --scene-teal-soft: light-dark(rgba(15, 118, 110, 0.14), rgba(79, 209, 197, 0.15));
              --scene-crimson: light-dark(#b91c1c, #ef5350);
              --scene-crimson-soft: light-dark(rgba(185, 28, 28, 0.14), rgba(239, 83, 80, 0.16));
              --scene-paper-ink: light-dark(#ffffff, #14100b);
            }
          }
          [data-scene="${id}"] .sc-card {
            fill: var(--sr-bg-elevated, #211e1b);
            stroke: var(--sr-border-strong, rgba(243, 237, 226, 0.16));
            stroke-width: 1.5;
          }
          [data-scene="${id}"] .sc-panel {
            fill: var(--sr-bg-canvas, #0e0d0c);
            stroke: var(--sr-border, rgba(243, 237, 226, 0.09));
            stroke-width: 1.25;
          }
          [data-scene="${id}"] .sc-wire {
            fill: none;
            stroke: var(--sr-border-strong, rgba(243, 237, 226, 0.22));
            stroke-width: 3.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          [data-scene="${id}"] .sc-amber-wire {
            fill: none;
            stroke: var(--sr-amber, #e5a44d);
            stroke-width: 3.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          [data-scene="${id}"] .sc-mono {
            font-family: var(--sr-font-mono, monospace);
            letter-spacing: 0.06em;
          }
          [data-scene="${id}"] .sc-title {
            font-family: var(--sr-font-display, Georgia);
            fill: var(--sr-ink, #f3ede2);
          }
        </style>
        ${artwork}
      </svg>`;

    const parts = Object.fromEntries(
      Array.from(root.querySelectorAll("[data-part]"), (node) => [node.dataset.part, node])
    );
    const durationMs = duration * 1000;
    let elapsedMs = 0;
    let lastTime;
    let frame;

    function tick(now) {
      if (lastTime !== undefined) {
        elapsedMs = (elapsedMs + (now - lastTime)) % durationMs;
      }
      lastTime = now;
      draw(parts, elapsedMs / 1000);
      frame = requestAnimationFrame(tick);
    }

    function pause() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      lastTime = undefined;
    }

    function resume() {
      if (frame === undefined) {
        frame = requestAnimationFrame(tick);
      }
    }

    function replay() {
      elapsedMs = 0;
      lastTime = undefined;
      draw(parts, 0);
      resume();
    }

    stageEl.replaceChildren(root);
    active = { root, pause, resume, replay };
    replay();
  }

  return {
    mount,
    unmount,
    pause: () => active?.pause(),
    resume: () => active?.resume(),
    replay: () => active?.replay(),
  };
}
