let supportsDisplayTransition;

function canTransitionDisplay() {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit() {
  return Boolean(window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay());
}

function buildField(labelText, valueText) {
  const wrap = document.createElement("div");
  wrap.className = "sr-codex-field";

  const label = document.createElement("h3");
  label.className = "sr-codex-label";
  label.textContent = labelText;

  const copy = document.createElement("p");
  copy.className = "sr-codex-copy";
  copy.textContent = valueText || "Not yet documented.";

  wrap.append(label, copy);
  return wrap;
}

function buildEntryCard(entry, showHeading) {
  const card = document.createElement("article");
  card.className = "sr-codex-card";

  if (showHeading) {
    const heading = document.createElement("h3");
    heading.className = "sr-codex-glossary-term";
    heading.textContent = entry.term;
    card.appendChild(heading);
  }

  card.append(
    buildField("Plain English", entry.plainEnglish),
    buildField("Why It Was Invented", entry.whyItWasInvented),
    buildField("Real-World Sighting", entry.realWorldSighting)
  );
  return card;
}

export function createCodexController({
  dialogEl,
  eyebrowEl,
  titleEl,
  bodyEl,
  closeBtn,
  onBeforeOpen,
  onAfterClose,
}) {
  let activeChapter = null;

  async function closeDrawer() {
    if (!dialogEl.open) return;
    if (!supportsTopLayerExit()) {
      dialogEl.setAttribute("data-closing", "");
      const animations = dialogEl.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((resolve) => setTimeout(resolve, 600)),
        ]);
      }
      if (!dialogEl.hasAttribute("data-closing")) return;
      dialogEl.removeAttribute("data-closing");
    }
    dialogEl.close();
  }

  // Fallback light-dismiss for browsers without <dialog closedby="any">
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    dialogEl.addEventListener("click", (event) => {
      if (event.target !== dialogEl) return;
      const rect = dialogEl.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) closeDrawer();
    });
  } else {
    dialogEl.addEventListener("click", (event) => {
      if (event.target === dialogEl && !supportsTopLayerExit()) {
        // Intercept click-on-backdrop only when exit fallback needs animation.
        const rect = dialogEl.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!inside) {
          event.preventDefault();
          closeDrawer();
        }
      }
    });
  }

  dialogEl.addEventListener("cancel", (event) => {
    if (!supportsTopLayerExit()) {
      event.preventDefault();
      closeDrawer();
    }
  });

  dialogEl.addEventListener("close", () => {
    dialogEl.removeAttribute("data-closing");
    onAfterClose?.();
  });

  closeBtn.addEventListener("click", () => {
    closeDrawer();
  });

  function showModalWithCoordination() {
    if (!dialogEl.open) {
      onBeforeOpen?.();
      dialogEl.removeAttribute("data-closing");
      dialogEl.showModal();
    }
  }

  return {
    setChapter(chapter) {
      activeChapter = chapter;
    },

    isOpen() {
      return dialogEl.open;
    },

    close() {
      closeDrawer();
    },

    openTerm(termId) {
      const entry = activeChapter?.codex?.[termId];
      if (!entry) return;
      eyebrowEl.textContent = "Active Codex";
      titleEl.textContent = entry.term || termId;
      bodyEl.replaceChildren(buildEntryCard(entry, false));
      showModalWithCoordination();
    },

    openGlossary() {
      if (!activeChapter) return;
      const entries = Object.values(activeChapter.codex || {});
      eyebrowEl.textContent = `Chapter ${activeChapter.chapterNumber ?? ""} Glossary`.trim();
      titleEl.textContent = activeChapter.title || "Chapter Glossary";

      if (entries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "sr-codex-empty";
        empty.textContent = "No codex entries defined for this chapter.";
        bodyEl.replaceChildren(empty);
      } else {
        bodyEl.replaceChildren(...entries.map((entry) => buildEntryCard(entry, true)));
      }
      showModalWithCoordination();
    },
  };
}
