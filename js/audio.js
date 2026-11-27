function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

export function createAudioController({
  playBtn,
  replayBtn,
  scrubber,
  statusEl,
  onPause,
  onResume,
  onReplay,
}) {
  const audio = new Audio();
  audio.preload = "metadata";

  let unlocked = false;
  let isAvailable = false;
  let hasSceneReplay = false;
  let isScrubbing = false;
  let loadSeq = 0;
  const preloaded = new Set();

  function syncScrubberProgress() {
    const max = Number(scrubber.max) || 100;
    const val = Number(scrubber.value) || 0;
    const pct = max > 0 ? Math.min(100, Math.max(0, (val / max) * 100)) : 0;
    scrubber.style.setProperty("--progress", `${pct}%`);
  }

  function updateUI() {
    if (!isAvailable) {
      statusEl.textContent = "Audio not yet loaded";
      playBtn.disabled = true;
      playBtn.textContent = "Play";
      playBtn.setAttribute("aria-pressed", "false");
      scrubber.disabled = true;
      scrubber.max = "100";
      scrubber.value = "0";
      syncScrubberProgress();
      replayBtn.disabled = !hasSceneReplay;
      return;
    }

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const playing = !audio.paused && !audio.ended;

    statusEl.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    playBtn.disabled = false;
    playBtn.textContent = playing ? "Pause" : "Play";
    playBtn.setAttribute("aria-pressed", String(playing));
    replayBtn.disabled = false;
    scrubber.disabled = !(duration > 0);

    if (!isScrubbing) {
      scrubber.max = String(duration > 0 ? duration : 100);
      scrubber.value = String(current);
      syncScrubberProgress();
    }
  }

  audio.addEventListener("loadedmetadata", () => {
    if (!audio.getAttribute("src")) return;
    isAvailable = true;
    updateUI();
  });

  audio.addEventListener("timeupdate", updateUI);
  audio.addEventListener("play", updateUI);
  audio.addEventListener("pause", updateUI);
  audio.addEventListener("ended", updateUI);

  audio.addEventListener("error", () => {
    isAvailable = false;
    updateUI();
  });

  playBtn.addEventListener("click", () => {
    if (!isAvailable) return;
    if (audio.paused || audio.ended) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            updateUI();
            onResume?.();
          })
          .catch(() => {
            updateUI();
          });
      }
    } else {
      audio.pause();
      updateUI();
      onPause?.();
    }
  });

  replayBtn.addEventListener("click", () => {
    if (isAvailable) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise) playPromise.catch(() => {});
      updateUI();
    }
    onReplay?.();
  });

  const endScrub = () => {
    isScrubbing = false;
  };
  scrubber.addEventListener("pointerdown", () => {
    isScrubbing = true;
  });
  scrubber.addEventListener("pointerup", endScrub);
  scrubber.addEventListener("change", endScrub);
  scrubber.addEventListener("input", () => {
    syncScrubberProgress();
    if (isAvailable && Number.isFinite(audio.duration)) {
      audio.currentTime = Number(scrubber.value);
      updateUI();
    }
  });

  return {
    unlock() {
      unlocked = true;
    },

    setSceneReplay(enabled) {
      hasSceneReplay = Boolean(enabled);
      if (!isAvailable) {
        replayBtn.disabled = !hasSceneReplay;
      }
    },

    stopAndReset() {
      loadSeq += 1;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      isAvailable = false;
      hasSceneReplay = false;
      updateUI();
    },

    loadPage(chapter, page, { sceneReplay = false } = {}) {
      const seq = ++loadSeq;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Ignore seek errors prior to source load.
      }
      isAvailable = false;
      hasSceneReplay = Boolean(sceneReplay);
      scrubber.value = "0";
      syncScrubberProgress();

      const pad = String(page.page).padStart(2, "0");
      const src = `assets/audio/${chapter.assetPrefix}-p${pad}.mp3`;
      audio.src = src;
      audio.load();
      updateUI();

      if (unlocked) {
        const playPromise = audio.play();
        if (playPromise) {
          playPromise
            .then(() => {
              if (seq === loadSeq && audio.getAttribute("src") === src) {
                isAvailable = true;
                updateUI();
              }
            })
            .catch(() => {
              // Missing MP3 or autoplay restriction degrades silently.
            });
        }
      }
    },

    pauseForOverlay() {
      const wasPlaying = isAvailable && !audio.paused && !audio.ended;
      if (wasPlaying) {
        audio.pause();
        updateUI();
      }
      return wasPlaying;
    },

    preloadNext(chapter, pageIndex) {
      const nextPage = chapter?.pages?.[pageIndex + 1];
      if (!nextPage) return;

      const pad = String(nextPage.page).padStart(2, "0");
      const audioUrl = `assets/audio/${chapter.assetPrefix}-p${pad}.mp3`;
      if (!preloaded.has(audioUrl)) {
        preloaded.add(audioUrl);
        fetch(audioUrl).catch(() => {});
      }

      if (nextPage.panelType === "image") {
        const imgUrl = `assets/panels/${chapter.assetPrefix}-p${pad}.webp`;
        if (!preloaded.has(imgUrl)) {
          preloaded.add(imgUrl);
          const img = new Image();
          img.onerror = () => {};
          img.src = imgUrl;
        }
      } else if (nextPage.panelType === "svg-scene" && nextPage.sceneModule) {
        const sceneUrl = new URL(
          `../content/${chapter.volumeId}/scenes/${nextPage.sceneModule}.js`,
          import.meta.url
        ).href;
        if (!preloaded.has(sceneUrl)) {
          preloaded.add(sceneUrl);
          import(sceneUrl).catch(() => {});
        }
      }
    },
  };
}
