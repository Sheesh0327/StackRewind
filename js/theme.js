const STORAGE_KEY = "sr-color-scheme";

function readStored() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === "light" || val === "dark" ? val : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage errors when persistence is blocked.
  }
}

function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors when persistence is blocked.
  }
}

export function initThemePicker(toggleBtn) {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (!meta) return;

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let override = readStored();

  function applyMeta(scheme) {
    meta.content = scheme === "light" || scheme === "dark" ? scheme : "light dark";
  }

  applyMeta(override);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const systemScheme = darkQuery.matches ? "dark" : "light";
      const renderedScheme = override ?? systemScheme;
      const targetScheme = renderedScheme === "dark" ? "light" : "dark";

      if (targetScheme !== systemScheme) {
        override = targetScheme;
        writeStored(targetScheme);
      } else {
        override = null;
        clearStored();
      }
      applyMeta(override);
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      override = readStored();
      applyMeta(override);
    }
  });

  // Intentionally do not clear a stored override when OS scheme changes.
  darkQuery.addEventListener("change", () => {
    if (!override) applyMeta(null);
  });
}
