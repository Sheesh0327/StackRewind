import { createAudioController } from "./audio.js";
import { createCodexController } from "./codex.js";
import { extractTermIds, parseDialogueToFragment } from "./parser.js";
import { initThemePicker } from "./theme.js";
import { createTutorController } from "./tutor.js";

const els = {
  brandName: document.getElementById("brand-name"),
  brandTagline: document.getElementById("brand-tagline"),
  switcherToggle: document.getElementById("switcher-toggle"),
  switcherLabel: document.getElementById("switcher-current-label"),
  switcherMenu: document.getElementById("switcher-menu"),
  themeToggle: document.getElementById("theme-toggle"),
  glossaryBtn: document.getElementById("glossary-btn"),
  coverCard: document.getElementById("cover-card"),
  coverBadge: document.getElementById("cover-volume-badge"),
  coverEra: document.getElementById("cover-era"),
  coverTitle: document.getElementById("cover-title"),
  coverSubtitle: document.getElementById("cover-subtitle"),
  coverTagline: document.getElementById("cover-tagline"),
  startBtn: document.getElementById("start-chapter-btn"),
  readerView: document.getElementById("reader-view"),
  stage: document.getElementById("panel-stage"),
  speaker: document.getElementById("page-speaker"),
  sceneTitle: document.getElementById("page-title"),
  dialogue: document.getElementById("page-dialogue"),
  deepDiveWrap: document.getElementById("page-deep-dive"),
  deepDiveTitle: document.getElementById("page-deep-dive-title"),
  deepDiveFocus: document.getElementById("page-deep-dive-focus"),
  deepDiveLink: document.getElementById("page-deep-dive-link"),
  prevBtn: document.getElementById("prev-page-btn"),
  nextBtn: document.getElementById("next-page-btn"),
  pageIndicator: document.getElementById("page-indicator"),
  audioPlayBtn: document.getElementById("audio-play-btn"),
  audioReplayBtn: document.getElementById("audio-replay-btn"),
  audioScrubber: document.getElementById("audio-scrubber"),
  audioStatus: document.getElementById("audio-status"),
  codexDialog: document.getElementById("codex-drawer"),
  codexEyebrow: document.getElementById("codex-eyebrow"),
  codexTitle: document.getElementById("codex-title"),
  codexBody: document.getElementById("codex-body"),
  codexCloseBtn: document.getElementById("codex-close-btn"),
  askTutorBtn: document.getElementById("ask-tutor-btn"),
  tutorDialog: document.getElementById("tutor-drawer"),
  tutorCloseBtn: document.getElementById("tutor-close-btn"),
  tutorForm: document.getElementById("tutor-form"),
  tutorContextPill: document.getElementById("tutor-context-pill"),
  tutorContextTerms: document.getElementById("tutor-context-terms"),
  tutorChips: document.getElementById("tutor-chips"),
  tutorQuestion: document.getElementById("tutor-question"),
  tutorProviderHint: document.getElementById("tutor-provider-hint"),
  tutorStatus: document.getElementById("tutor-status"),
  tutorSubmitBtn: document.getElementById("tutor-submit-btn"),
  tutorCopyBtn: document.getElementById("tutor-copy-btn"),
  tutorPreviewDetails: document.getElementById("tutor-preview-details"),
  tutorBudgetBadge: document.getElementById("tutor-budget-badge"),
  tutorPreviewText: document.getElementById("tutor-preview-text"),
};

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const state = {
  manifest: null,
  volume: null,
  chapterMeta: null,
  chapter: null,
  pageIndex: 0,
  entered: false,
  activeScene: null,
  renderToken: 0,
  wasAudioPlayingBeforeCodex: false,
  checkedChapters: new Set(),
};

const audio = createAudioController({
  playBtn: els.audioPlayBtn,
  replayBtn: els.audioReplayBtn,
  scrubber: els.audioScrubber,
  statusEl: els.audioStatus,
  onPause: () => state.activeScene?.pause?.(),
  onResume: () => state.activeScene?.resume?.(),
  onReplay: () => state.activeScene?.replay?.(),
});

function pauseForModalOverlay() {
  state.wasAudioPlayingBeforeCodex = audio.pauseForOverlay();
  state.activeScene?.pause?.();
}

function resumeAfterModalOverlay() {
  if (!state.wasAudioPlayingBeforeCodex) {
    state.activeScene?.resume?.();
  }
  state.wasAudioPlayingBeforeCodex = false;
}

const codex = createCodexController({
  dialogEl: els.codexDialog,
  eyebrowEl: els.codexEyebrow,
  titleEl: els.codexTitle,
  bodyEl: els.codexBody,
  closeBtn: els.codexCloseBtn,
  onBeforeOpen: pauseForModalOverlay,
  onAfterClose: resumeAfterModalOverlay,
});

const tutor = createTutorController({
  dialogEl: els.tutorDialog,
  closeBtn: els.tutorCloseBtn,
  formEl: els.tutorForm,
  contextPillEl: els.tutorContextPill,
  contextTermsEl: els.tutorContextTerms,
  chipsEl: els.tutorChips,
  questionEl: els.tutorQuestion,
  providerHintEl: els.tutorProviderHint,
  statusEl: els.tutorStatus,
  submitBtn: els.tutorSubmitBtn,
  copyBtn: els.tutorCopyBtn,
  previewDetailsEl: els.tutorPreviewDetails,
  budgetBadgeEl: els.tutorBudgetBadge,
  previewTextEl: els.tutorPreviewText,
  onBeforeOpen: pauseForModalOverlay,
  onAfterClose: resumeAfterModalOverlay,
});

function validateCartridgeChapter(chapter, dataPath) {
  if (state.checkedChapters.has(dataPath)) return;
  state.checkedChapters.add(dataPath);

  const reqChapter = ["volumeId", "chapterId", "assetPrefix", "title", "pages", "codex"];
  for (const field of reqChapter) {
    if (chapter[field] === undefined || chapter[field] === null || chapter[field] === "") {
      console.warn(`[Cartridge Check] Missing chapter field "${field}" in ${dataPath}`);
    }
  }
  if (!Array.isArray(chapter.pages) || chapter.pages.length === 0) {
    console.warn(`[Cartridge Check] Chapter "${dataPath}" has no pages.`);
    return;
  }
  for (const page of chapter.pages) {
    for (const field of ["page", "panelType", "title", "speaker", "dialogue"]) {
      if (!page[field]) {
        console.warn(`[Cartridge Check] Page ${page.page ?? "?"} missing "${field}" in ${dataPath}`);
      }
    }
    if (page.panelType === "svg-scene" && !page.sceneModule) {
      console.warn(`[Cartridge Check] Page ${page.page} svg-scene missing "sceneModule" in ${dataPath}`);
    }
    for (const termId of extractTermIds(page.dialogue)) {
      if (!chapter.codex || !Object.hasOwn(chapter.codex, termId)) {
        console.warn(`[Cartridge Check] Unresolved codex token "${termId}" on page ${page.page}`);
      }
    }
  }
}

function buildBlueprintFallback(page, label = "BLUEPRINT PLACEHOLDER") {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 960 540");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${page.title} placeholder`);

  const bg = document.createElementNS(ns, "rect");
  bg.setAttribute("width", "960");
  bg.setAttribute("height", "540");
  bg.setAttribute("fill", "var(--sr-bg-surface)");
  svg.appendChild(bg);

  const frame = document.createElementNS(ns, "rect");
  frame.setAttribute("x", "56");
  frame.setAttribute("y", "56");
  frame.setAttribute("width", "848");
  frame.setAttribute("height", "428");
  frame.setAttribute("rx", "8");
  frame.setAttribute("fill", "var(--sr-bg-elevated)");
  frame.setAttribute("stroke", "var(--sr-border-strong)");
  frame.setAttribute("stroke-dasharray", "8 6");
  svg.appendChild(frame);

  const pad = String(page.page).padStart(2, "0");
  const tag = document.createElementNS(ns, "text");
  tag.setAttribute("x", "96");
  tag.setAttribute("y", "124");
  tag.setAttribute("fill", "var(--sr-amber)");
  tag.setAttribute("font-family", "var(--sr-font-mono)");
  tag.setAttribute("font-size", "16");
  tag.textContent = `SCENE ${pad} · ${label}`;
  svg.appendChild(tag);

  const title = document.createElementNS(ns, "text");
  title.setAttribute("x", "96");
  title.setAttribute("y", "184");
  title.setAttribute("fill", "var(--sr-ink)");
  title.setAttribute("font-family", "var(--sr-font-display)");
  title.setAttribute("font-size", "32");
  title.textContent = page.title || `Page ${pad}`;
  svg.appendChild(title);

  const notes = document.createElementNS(ns, "text");
  notes.setAttribute("x", "96");
  notes.setAttribute("y", "240");
  notes.setAttribute("fill", "var(--sr-ink-secondary)");
  notes.setAttribute("font-family", "var(--sr-font-mono)");
  notes.setAttribute("font-size", "16");
  notes.textContent = page.sceneNotes || "Awaiting cartridge visual asset.";
  svg.appendChild(notes);

  return svg;
}

function unmountActiveScene() {
  if (state.activeScene) {
    try {
      state.activeScene.unmount?.();
    } catch (err) {
      console.warn("[Cartridge Check] Scene unmount() threw:", err);
    }
    state.activeScene = null;
  }
  delete els.stage.dataset.scene;
  els.stage.replaceChildren();
}

function getNextPublishedChapter() {
  const chapters = state.volume?.chapters || [];
  const idx = chapters.findIndex((c) => c.id === state.chapterMeta?.id);
  return idx >= 0 && idx + 1 < chapters.length ? chapters[idx + 1] : null;
}

function resolveRouteFromHash() {
  const raw = window.location.hash.replace(/^#/, "").trim();
  const [volId, chId, pageStr] = raw.split("/");
  const volumes = state.manifest.volumes || [];
  const publishedVolumes = volumes.filter((v) => v.status === "published" && v.chapters?.length);
  const def = state.manifest.defaultRoute || {};

  let volume = publishedVolumes.find((v) => v.id === volId)
    || publishedVolumes.find((v) => v.id === def.volume)
    || publishedVolumes[0];

  let chapterMeta = volume.chapters.find((c) => c.id === chId)
    || volume.chapters.find((c) => c.id === def.chapter)
    || volume.chapters[0];

  const parsedPage = Number.parseInt(pageStr, 10);
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  return { volume, chapterMeta, requestedPage };
}

function syncHash(volId, chId, pageNum) {
  const targetHash = `#${volId}/${chId}/${pageNum}`;
  if (window.location.hash !== targetHash) {
    history.replaceState(null, "", targetHash);
  }
}

function renderArchiveSwitcher() {
  els.switcherMenu.replaceChildren();
  for (const vol of state.manifest.volumes || []) {
    const group = document.createElement("div");
    group.className = "sr-switcher-group";

    const isPublished = vol.status === "published" && vol.chapters?.length > 0;
    const volHeader = document.createElement("div");
    volHeader.className = `sr-switcher-vol${isPublished ? "" : " is-soon"}`;
    volHeader.textContent = `Vol ${vol.number} · ${vol.title}`;
    if (!isPublished) {
      const badge = document.createElement("span");
      badge.textContent = "Coming Soon";
      volHeader.appendChild(badge);
    }
    group.appendChild(volHeader);

    if (isPublished) {
      for (const ch of vol.chapters) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sr-switcher-item";
        const isCurrent = state.volume?.id === vol.id && state.chapterMeta?.id === ch.id;
        if (isCurrent) btn.setAttribute("aria-current", "true");

        const titleSpan = document.createElement("span");
        titleSpan.textContent = `Ch ${ch.number}: ${ch.title}`;
        const eraSpan = document.createElement("span");
        eraSpan.textContent = ch.era || "";
        eraSpan.style.color = "var(--sr-ink-muted)";
        eraSpan.style.fontSize = "0.75rem";
        btn.append(titleSpan, eraSpan);

        btn.addEventListener("click", () => {
          closeSwitcher();
          state.entered = false;
          window.location.hash = `#${vol.id}/${ch.id}/1`;
        });
        group.appendChild(btn);
      }
    } else {
      const note = document.createElement("div");
      note.className = "sr-switcher-soon-note";
      note.textContent = "Archive slot reserved for future cartridge.";
      group.appendChild(note);
    }
    els.switcherMenu.appendChild(group);
  }
  if (state.volume && state.chapterMeta) {
    els.switcherLabel.textContent = `${state.volume.title} · Ch ${state.chapterMeta.number}`;
  }
}

function closeSwitcher() {
  els.switcherMenu.hidden = true;
  els.switcherToggle.setAttribute("aria-expanded", "false");
}

function renderCoverCard() {
  unmountActiveScene();
  audio.stopAndReset();

  const pageNum = state.pageIndex + 1;
  els.coverBadge.textContent = `Volume ${state.volume.number} · ${state.volume.title}`;
  els.coverEra.textContent = state.chapter.era || state.chapterMeta.era || "";
  els.coverTitle.textContent = state.chapter.title || state.chapterMeta.title;
  els.coverSubtitle.textContent = state.chapter.subtitle || state.chapterMeta.subtitle || "";
  els.coverTagline.textContent = state.manifest.brand?.tagline || "";
  els.startBtn.textContent = pageNum > 1 ? `Continue Chapter — Page ${pageNum}` : "Start Chapter";

  els.readerView.hidden = true;
  els.coverCard.hidden = false;
}

function isValidYouTubeUrl(rawUrl) {
  if (typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "youtube.com" ||
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "m.youtube.com" ||
        parsed.hostname === "youtu.be")
    );
  } catch {
    return false;
  }
}

async function renderPage() {
  const token = ++state.renderToken;
  const page = state.chapter.pages[state.pageIndex];
  const total = state.chapter.pages.length;
  const pageNum = state.pageIndex + 1;

  syncHash(state.volume.id, state.chapterMeta.id, pageNum);
  unmountActiveScene();

  els.coverCard.hidden = true;
  els.readerView.hidden = false;

  els.stage.classList.remove("is-entering");
  void els.stage.offsetWidth;
  els.stage.classList.add("is-entering");

  els.speaker.textContent = page.speaker || "Narrator";
  els.sceneTitle.textContent = page.title || "";
  els.dialogue.replaceChildren(
    parseDialogueToFragment(page.dialogue, state.chapter.codex, (termId) => codex.openTerm(termId))
  );
  tutor.setContext({
    volume: state.volume,
    chapter: state.chapter,
    page,
    pageIndex: state.pageIndex,
  });

  if (page.deepDive && isValidYouTubeUrl(page.deepDive.url)) {
    const dd = page.deepDive;
    els.deepDiveTitle.textContent = dd.channel ? `${dd.title} — ${dd.channel}` : dd.title;
    els.deepDiveFocus.textContent = dd.focus || "";
    els.deepDiveLink.href = dd.url;
    els.deepDiveWrap.hidden = false;
  } else {
    els.deepDiveLink.href = "#";
    els.deepDiveWrap.hidden = true;
  }

  els.pageIndicator.textContent = `Page ${pageNum} / ${total}`;
  els.prevBtn.disabled = state.pageIndex === 0;

  const nextCh = getNextPublishedChapter();
  if (state.pageIndex < total - 1) {
    els.nextBtn.disabled = false;
    els.nextBtn.textContent = "Next";
  } else if (nextCh) {
    els.nextBtn.disabled = false;
    els.nextBtn.textContent = "Next Chapter →";
  } else {
    els.nextBtn.disabled = true;
    els.nextBtn.textContent = "Next";
  }

  audio.loadPage(state.chapter, page, { sceneReplay: false });
  audio.preloadNext(state.chapter, state.pageIndex);

  if (page.panelType === "svg-scene" && page.sceneModule) {
    els.stage.dataset.scene = page.sceneModule;
    try {
      const moduleUrl = new URL(
        `../content/${state.chapter.volumeId}/scenes/${page.sceneModule}.js`,
        import.meta.url
      ).href;
      const mod = await import(moduleUrl);
      if (token !== state.renderToken) return;

      if (typeof mod.mount !== "function" || typeof mod.unmount !== "function") {
        console.warn(`[Cartridge Check] Scene "${page.sceneModule}" must export mount() and unmount().`);
        delete els.stage.dataset.scene;
        els.stage.replaceChildren(buildBlueprintFallback(page, "SCENE CONTRACT FALLBACK"));
        return;
      }

      mod.mount(els.stage, {
        page,
        chapter: state.chapter,
        reducedMotion: reducedMotionQuery.matches,
        openCodex: (termId) => codex.openTerm(termId),
      });
      state.activeScene = mod;
      audio.setSceneReplay(typeof mod.replay === "function");
    } catch (err) {
      if (token !== state.renderToken) return;
      console.warn(`[Cartridge Check] Failed to load scene "${page.sceneModule}":`, err);
      delete els.stage.dataset.scene;
      els.stage.replaceChildren(buildBlueprintFallback(page, "SCENE LOAD FALLBACK"));
    }
    return;
  }

  const pad = String(page.page).padStart(2, "0");
  const img = document.createElement("img");
  img.alt = page.title || `Panel ${pad}`;
  img.hidden = true;
  img.addEventListener("load", () => {
    if (token === state.renderToken) img.hidden = false;
  });
  img.addEventListener("error", () => {
    if (token === state.renderToken) {
      els.stage.replaceChildren(buildBlueprintFallback(page));
    }
  });
  img.src = `assets/panels/${state.chapter.assetPrefix}-p${pad}.webp`;
  els.stage.replaceChildren(img);
}

async function applyRoute() {
  const { volume, chapterMeta, requestedPage } = resolveRouteFromHash();
  const chapterChanged = !state.chapter || state.chapterMeta?.id !== chapterMeta.id || state.volume?.id !== volume.id;

  state.volume = volume;
  state.chapterMeta = chapterMeta;

  if (chapterChanged) {
    const res = await fetch(chapterMeta.dataPath);
    state.chapter = await res.json();
    validateCartridgeChapter(state.chapter, chapterMeta.dataPath);
    codex.setChapter(state.chapter);
    els.glossaryBtn.disabled = false;
  }

  const maxPage = state.chapter.pages.length;
  const clampedPage = Math.min(Math.max(1, requestedPage), maxPage);
  state.pageIndex = clampedPage - 1;
  syncHash(volume.id, chapterMeta.id, clampedPage);
  renderArchiveSwitcher();

  if (state.entered) {
    renderPage();
  } else {
    renderCoverCard();
  }
}

function goPrev() {
  if (!state.entered || state.pageIndex <= 0) return;
  state.pageIndex -= 1;
  renderPage();
}

function goNext() {
  if (!state.entered) return;
  const total = state.chapter.pages.length;
  if (state.pageIndex < total - 1) {
    state.pageIndex += 1;
    renderPage();
    return;
  }
  const nextCh = getNextPublishedChapter();
  if (nextCh) {
    state.entered = false;
    window.location.hash = `#${state.volume.id}/${nextCh.id}/1`;
  }
}

async function init() {
  initThemePicker(els.themeToggle);

  const res = await fetch("content/manifest.json");
  state.manifest = await res.json();

  const brandName = state.manifest.brand?.name || "StackRewind";
  const tagline = state.manifest.brand?.tagline || "";
  els.brandName.textContent = brandName;
  els.brandTagline.textContent = tagline;
  document.title = brandName;

  els.switcherToggle.addEventListener("click", () => {
    const nextHidden = !els.switcherMenu.hidden;
    els.switcherMenu.hidden = nextHidden;
    els.switcherToggle.setAttribute("aria-expanded", String(!nextHidden));
  });

  document.addEventListener("click", (event) => {
    if (!els.switcherMenu.hidden && !event.target.closest("#archive-switcher")) {
      closeSwitcher();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.switcherMenu.hidden) {
      closeSwitcher();
      els.switcherToggle.focus();
      return;
    }
    if (codex.isOpen() || tutor.isOpen() || !state.entered) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  });

  els.startBtn.addEventListener("click", () => {
    audio.unlock();
    state.entered = true;
    renderPage();
  });

  els.prevBtn.addEventListener("click", goPrev);
  els.nextBtn.addEventListener("click", goNext);
  els.glossaryBtn.addEventListener("click", () => codex.openGlossary());
  els.askTutorBtn.addEventListener("click", () => tutor.open());
  els.deepDiveLink.addEventListener("click", () => {
    audio.pauseForOverlay();
  });

  window.addEventListener("hashchange", () => {
    applyRoute();
  });

  await applyRoute();
}

init();
