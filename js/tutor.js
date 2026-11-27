import { extractTermIds } from "./parser.js";

const STORAGE_KEY = "sr-tutor-provider";
const TOKEN_RE = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
export const MAX_ENCODED_URL_CHARS = 1950;

export const PROVIDERS = {
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    mode: "url",
    cta: "Send to ChatGPT",
    hint: "Opens ChatGPT in a new tab with this page's context and your question prefilled (and copies the prompt as a backup).",
    buildUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  claude: {
    id: "claude",
    label: "Claude",
    mode: "url",
    cta: "Send to Claude",
    hint: "Opens Claude in a new tab with this page's context and your question prefilled (and copies the prompt as a backup).",
    buildUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    mode: "clipboard-open",
    cta: "Copy & Open Gemini",
    hint: "Gemini ignores URL query prompts, so clicking copies the full prompt to your clipboard and opens Gemini ready to paste (Ctrl+V / Cmd+V).",
    url: "https://gemini.google.com/app",
  },
  copy: {
    id: "copy",
    label: "Copy Only",
    mode: "clipboard-only",
    cta: "Copy Tutor Prompt",
    hint: "Copies the full page-contextual prompt to your clipboard so you can paste it into any AI tool.",
  },
};

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

function readStoredProvider() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val && Object.hasOwn(PROVIDERS, val) ? val : "chatgpt";
  } catch {
    return "chatgpt";
  }
}

function writeStoredProvider(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ignore storage errors when persistence is blocked.
  }
}

export function stripDialogueTokens(text) {
  if (typeof text !== "string") return "";
  return text.replace(TOKEN_RE, "$1").trim();
}

export function collectPageCodexEntries(chapter, page) {
  const codex = chapter?.codex || {};
  const seen = new Set();
  const entries = [];
  for (const termId of extractTermIds(page?.dialogue || "")) {
    if (seen.has(termId) || !Object.hasOwn(codex, termId)) continue;
    seen.add(termId);
    const entry = codex[termId];
    if (entry?.term) entries.push({ id: termId, ...entry });
  }
  return entries;
}

function truncateText(text, maxChars) {
  if (!text || text.length <= maxChars) return text;
  if (maxChars <= 1) return text.slice(0, maxChars);
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

export function buildTutorPrompt(ctx, question, opts = {}) {
  const {
    includeSceneNotes = true,
    codexCount = Infinity,
    narrationMaxChars = Infinity,
    compact = false,
  } = opts;

  const volumeTitle = ctx?.volume?.title || "StackRewind";
  const chapterTitle = ctx?.chapter?.title || "Untitled Chapter";
  const chapterNum = ctx?.chapter?.chapterNumber ?? ctx?.chapter?.id ?? "";
  const era = ctx?.chapter?.era ? ` (${ctx.chapter.era})` : "";
  const pageNum = (ctx?.pageIndex ?? 0) + 1;
  const totalPages = ctx?.chapter?.pages?.length || 1;
  const pageTitle = ctx?.page?.title || `Page ${pageNum}`;
  const rawNarration = (ctx?.page?.tts && ctx.page.tts.trim())
    || stripDialogueTokens(ctx?.page?.dialogue || "");
  const narration = Number.isFinite(narrationMaxChars)
    ? truncateText(rawNarration, narrationMaxChars)
    : rawNarration;

  const trimmedQuestion = (question || "").trim() || "<Type your question above>";

  if (compact) {
    return [
      "You are a concise, mechanism-first CS tutor for StackRewind.",
      `Context: ${volumeTitle} Ch ${chapterNum} "${chapterTitle}"${era} — Page ${pageNum}/${totalPages}: "${pageTitle}".`,
      narration ? `Excerpt: "${narration}"` : "",
      `Reader's Question:\n${trimmedQuestion}`,
      "Explain the concrete mechanism clearly and end with 1 short follow-up question.",
    ].filter(Boolean).join("\n\n");
  }

  const lines = [
    "You are a concise, mechanism-first computer science tutor helping a reader on StackRewind.",
    "",
    "Active Page Context:",
    `- Volume: ${volumeTitle}`,
    `- Chapter ${chapterNum}: "${chapterTitle}"${era}`,
    `- Page ${pageNum}/${totalPages}: "${pageTitle}"`,
  ];

  if (narration) {
    lines.push(`- Narration: "${narration}"`);
  }
  if (includeSceneNotes && ctx?.page?.sceneNotes) {
    lines.push(`- Visual Scene: ${ctx.page.sceneNotes}`);
  }

  const allEntries = collectPageCodexEntries(ctx?.chapter, ctx?.page);
  const selectedEntries = Number.isFinite(codexCount)
    ? allEntries.slice(0, Math.max(0, codexCount))
    : allEntries;

  if (selectedEntries.length > 0) {
    lines.push("- Key Terms on This Page:");
    for (const entry of selectedEntries) {
      lines.push(`  * ${entry.term}: ${entry.plainEnglish}`);
    }
  }

  lines.push(
    "",
    "Reader's Question:",
    trimmedQuestion,
    "",
    "Explain the concrete engineering mechanism step by step (bits, headers, signals, buffers, or state transitions), stay anchored to this topic, and suggest 1 brief follow-up question."
  );

  return lines.join("\n");
}

export function buildUrlBudgetedPrompt(ctx, question, buildUrlFn, maxChars = MAX_ENCODED_URL_CHARS) {
  const fullPrompt = buildTutorPrompt(ctx, question);
  const fullUrl = buildUrlFn(fullPrompt);
  if (fullUrl.length <= maxChars) {
    return { prompt: fullPrompt, url: fullUrl, trimmed: false, questionClippedInUrl: false };
  }

  const allEntries = collectPageCodexEntries(ctx?.chapter, ctx?.page);
  const attempts = [
    { includeSceneNotes: false, codexCount: allEntries.length, narrationMaxChars: Infinity },
  ];

  for (let c = allEntries.length - 1; c >= 0; c--) {
    attempts.push({ includeSceneNotes: false, codexCount: c, narrationMaxChars: Infinity });
  }
  for (const limit of [280, 180, 100, 0]) {
    attempts.push({ includeSceneNotes: false, codexCount: 0, narrationMaxChars: limit });
  }
  attempts.push({ compact: true, narrationMaxChars: 140 });
  attempts.push({ compact: true, narrationMaxChars: 0 });

  for (const opts of attempts) {
    const candidate = buildTutorPrompt(ctx, question, opts);
    const url = buildUrlFn(candidate);
    if (url.length <= maxChars) {
      return { prompt: candidate, url, trimmed: true, questionClippedInUrl: false };
    }
  }

  // Last resort: reader's own question is extraordinarily long; clip URL question slice cleanly
  // while keeping the full untrimmed prompt copied to clipboard.
  const trimmedQ = (question || "").trim();
  let lo = 1;
  let hi = trimmedQ.length;
  let bestUrl = buildUrlFn(buildTutorPrompt(ctx, "", { compact: true, narrationMaxChars: 0 }));
  let bestPrompt = buildTutorPrompt(ctx, "", { compact: true, narrationMaxChars: 0 });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const slice = truncateText(trimmedQ, mid);
    const candidate = buildTutorPrompt(ctx, slice, { compact: true, narrationMaxChars: 0 });
    const url = buildUrlFn(candidate);
    if (url.length <= maxChars) {
      bestUrl = url;
      bestPrompt = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return { prompt: bestPrompt, url: bestUrl, trimmed: true, questionClippedInUrl: true };
}

function buildStarterQuestions(ctx) {
  const pageTitle = ctx?.page?.title || "this page";
  const entries = collectPageCodexEntries(ctx?.chapter, ctx?.page);
  const q1 = entries[0]
    ? {
        label: `Explain ${entries[0].term} simply`,
        prompt: `Explain ${entries[0].term} on "${pageTitle}" with a concrete mechanism-first analogy.`,
      }
    : {
        label: "Explain with an analogy",
        prompt: `Explain the core mechanism on "${pageTitle}" with a concrete analogy.`,
      };

  const q2 = entries[1]
    ? {
        label: `Why invent ${entries[1].term}?`,
        prompt: `What engineering problem forced ${entries[1].term} to be invented, and what trade-off does it introduce?`,
      }
    : {
        label: "Why was this needed?",
        prompt: `What specific bottleneck broke earlier designs and forced the mechanism on "${pageTitle}"?`,
      };

  const q3 = {
    label: "Quiz me on this page",
    prompt: `Quiz me with 2 short mechanism-first questions about "${pageTitle}" and wait for my answers.`,
  };

  return [q1, q2, q3];
}

async function copyTextToClipboard(text) {
  if (!navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function createTutorController({
  dialogEl,
  closeBtn,
  formEl,
  contextPillEl,
  contextTermsEl,
  chipsEl,
  questionEl,
  providerHintEl,
  statusEl,
  submitBtn,
  copyBtn,
  previewDetailsEl,
  budgetBadgeEl,
  previewTextEl,
  onBeforeOpen,
  onAfterClose,
}) {
  let ctx = { volume: null, chapter: null, page: null, pageIndex: 0 };
  let activeProviderId = readStoredProvider();

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

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.removeAttribute("data-tone");
    statusEl.replaceChildren();
  }

  function showStatus(tone, message, fallbackLink) {
    statusEl.replaceChildren();
    statusEl.dataset.tone = tone;
    const msg = document.createElement("span");
    msg.textContent = message;
    statusEl.appendChild(msg);

    if (fallbackLink) {
      const anchor = document.createElement("a");
      anchor.className = "sr-tutor-fallback-link";
      anchor.href = fallbackLink.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = fallbackLink.label;
      statusEl.appendChild(anchor);
    }
    statusEl.hidden = false;
  }

  function getProvider() {
    return PROVIDERS[activeProviderId] || PROVIDERS.chatgpt;
  }

  function syncProviderUI() {
    const provider = getProvider();
    const radios = formEl.querySelectorAll('input[name="tutor-provider"]');
    for (const radio of radios) {
      radio.checked = radio.value === provider.id;
    }
    providerHintEl.textContent = provider.hint;
    submitBtn.textContent = provider.cta;
    updatePreview();
  }

  function updatePreview() {
    const question = questionEl.value;
    const fullPrompt = buildTutorPrompt(ctx, question);
    previewTextEl.textContent = fullPrompt;

    const provider = getProvider();
    if (provider.mode === "url") {
      const budgeted = buildUrlBudgetedPrompt(ctx, question, provider.buildUrl);
      budgetBadgeEl.textContent = budgeted.trimmed
        ? `${budgeted.url.length} / ${MAX_ENCODED_URL_CHARS} URL chars (trimmed)`
        : `${budgeted.url.length} / ${MAX_ENCODED_URL_CHARS} URL chars`;
    } else if (provider.mode === "clipboard-open") {
      budgetBadgeEl.textContent = `${fullPrompt.length} chars (clipboard)`;
    } else {
      budgetBadgeEl.textContent = `${fullPrompt.length} chars`;
    }
  }

  function renderChips() {
    const starters = buildStarterQuestions(ctx);
    chipsEl.replaceChildren();
    for (const item of starters) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sr-tutor-chip";
      btn.textContent = item.label;
      btn.addEventListener("click", () => {
        questionEl.value = item.prompt;
        clearStatus();
        updatePreview();
        questionEl.focus();
      });
      chipsEl.appendChild(btn);
    }
  }

  function openFallbackPreviewSelection() {
    previewDetailsEl.open = true;
    const range = document.createRange();
    range.selectNodeContents(previewTextEl);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  async function handleCopyOnly(fullPrompt, customOkMessage) {
    const copied = await copyTextToClipboard(fullPrompt);
    if (copied) {
      showStatus("ok", customOkMessage || "Full tutor prompt copied to clipboard.");
    } else {
      openFallbackPreviewSelection();
      showStatus(
        "warn",
        "Clipboard access was blocked by the browser. The prompt preview below is expanded and selected — copy it manually (Ctrl+C / Cmd+C)."
      );
    }
  }

  function handleSubmit() {
    const question = questionEl.value.trim();
    if (!question) {
      showStatus("warn", "Enter a question above or pick a starter chip first.");
      questionEl.focus();
      return;
    }

    const provider = getProvider();
    const fullPrompt = buildTutorPrompt(ctx, question);

    if (provider.mode === "clipboard-only") {
      void handleCopyOnly(fullPrompt);
      return;
    }

    if (provider.mode === "url") {
      const budgeted = buildUrlBudgetedPrompt(ctx, question, provider.buildUrl);
      // Open synchronously in user gesture before any await so popup blockers do not trigger.
      const win = window.open(budgeted.url, "_blank", "noopener,noreferrer");

      void copyTextToClipboard(fullPrompt).then((copied) => {
        const trimNote = budgeted.questionClippedInUrl
          ? " URL payload was clipped to fit browser limits; full prompt is in your clipboard."
          : budgeted.trimmed
            ? " Extra page notes were trimmed to fit URL limits; full prompt is in your clipboard."
            : copied
              ? " Full prompt also copied to clipboard."
              : "";

        if (win === null) {
          if (!copied) openFallbackPreviewSelection();
          showStatus(
            "warn",
            `Popup blocked by your browser.${trimNote} Use the direct link below to open ${provider.label}:`,
            { href: budgeted.url, label: `Open ${provider.label} ↗` }
          );
          return;
        }

        showStatus("ok", `Opened ${provider.label} in a new tab.${trimNote}`);
      });
      return;
    }

    // provider.mode === "clipboard-open" (Gemini)
    const win = window.open(provider.url, "_blank", "noopener,noreferrer");
    void copyTextToClipboard(fullPrompt).then((copied) => {
      if (win === null && copied) {
        showStatus(
          "warn",
          "Prompt copied to clipboard — popup was blocked, so click below and press Ctrl+V (or Cmd+V) inside Gemini:",
          { href: provider.url, label: "Open Gemini ↗" }
        );
        return;
      }
      if (win === null && !copied) {
        openFallbackPreviewSelection();
        showStatus(
          "warn",
          "Popup and clipboard were blocked. Copy the selected prompt below, then open Gemini:",
          { href: provider.url, label: "Open Gemini ↗" }
        );
        return;
      }
      if (!copied) {
        openFallbackPreviewSelection();
        showStatus(
          "warn",
          "Opened Gemini, but clipboard access was blocked. Copy the selected prompt below and paste it into Gemini."
        );
        return;
      }
      showStatus(
        "ok",
        "Prompt copied — press Ctrl+V (or Cmd+V) inside the new Gemini tab."
      );
    });
  }

  formEl.addEventListener("change", (event) => {
    const target = event.target;
    if (target?.name === "tutor-provider" && Object.hasOwn(PROVIDERS, target.value)) {
      activeProviderId = target.value;
      writeStoredProvider(activeProviderId);
      clearStatus();
      syncProviderUI();
    }
  });

  questionEl.addEventListener("input", () => {
    clearStatus();
    updatePreview();
  });

  questionEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  });

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });

  copyBtn.addEventListener("click", () => {
    const question = questionEl.value.trim();
    if (!question) {
      showStatus("warn", "Enter a question above or pick a starter chip first.");
      questionEl.focus();
      return;
    }
    const fullPrompt = buildTutorPrompt(ctx, question);
    void handleCopyOnly(fullPrompt);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      activeProviderId = readStoredProvider();
      syncProviderUI();
    }
  });

  syncProviderUI();

  return {
    setContext(nextCtx) {
      ctx = {
        volume: nextCtx?.volume || null,
        chapter: nextCtx?.chapter || null,
        page: nextCtx?.page || null,
        pageIndex: nextCtx?.pageIndex ?? 0,
      };
      const volNum = ctx.volume?.number ?? "";
      const chNum = ctx.chapter?.chapterNumber ?? ctx.chapter?.id ?? "";
      const pageNum = ctx.pageIndex + 1;
      const total = ctx.chapter?.pages?.length || 1;
      const pageTitle = ctx.page?.title || "";
      contextPillEl.textContent = `Vol ${volNum} · Ch ${chNum} · Page ${pageNum}/${total}${pageTitle ? ` — ${pageTitle}` : ""}`;

      const entries = collectPageCodexEntries(ctx.chapter, ctx.page);
      contextTermsEl.textContent = entries.length > 0
        ? `Page terms included: ${entries.map((e) => e.term).join(", ")}`
        : "Page narration & scene context included";

      clearStatus();
      renderChips();
      updatePreview();
    },

    isOpen() {
      return dialogEl.open;
    },

    open() {
      if (!dialogEl.open) {
        onBeforeOpen?.();
        dialogEl.removeAttribute("data-closing");
        clearStatus();
        updatePreview();
        dialogEl.showModal();
        questionEl.focus();
      }
    },

    close() {
      closeDrawer();
    },
  };
}
