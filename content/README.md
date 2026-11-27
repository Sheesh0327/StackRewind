# StackRewind Cartridge Authoring Contract

This directory (`content/`) and `assets/` contain **Writable Content Cartridges**.
The reader engine (`index.html`, `css/`, `js/`) is the **Read-Only Console**.

> **Hard Boundary Rule:** Adding or editing chapters, volumes, codex entries, SVG scenes, TTS scripts, or audio MUST NEVER require edits to `index.html`, `css/`, or `js/`.
> **Turnkey Rule:** Every authored chapter MUST ship all deliverables together (JSON + codex + looping SVG scenes + `tts` scripts + `.mp3` audio + `manifest.json` registration) and pass `node scripts/validate-cartridge.mjs`.

---

## 1. Canonical Directory & Asset Conventions

For Networking, use the [volume roadmap](networking/ROADMAP.md) to choose the next chapter and find its research brief. Match the roadmap order against the published manifest and select the first missing chapter before starting chapter authoring. Set the chapter length at storyboard review based on the scenes readers need to understand the mechanism.

```text
content/
├── README.md
├── manifest.json
└── <volumeId>/
    ├── chapter<N>.json
    ├── scenes/
    │   ├── looping-scene.js
    │   └── <assetPrefix>-p<00>.js
    └── tts/
        └── <assetPrefix>-tts.json
assets/
├── panels/
│   └── <assetPrefix>-p<00>.webp
└── audio/
    └── <assetPrefix>-p<00>.mp3
```

- All chapter JSONs, SVG scene modules, and TTS manifests live under `content/<volumeId>/` (never in split `data/` or `js/scenes/` folders).
- Page numbers in media and scene filenames are zero-padded to 2 digits (`p01`, `p02`, ..., `p12`).

---

## 2. `content/manifest.json` Schema

Register volumes and chapters centrally in `content/manifest.json`:

```json
{
  "brand": {
    "name": "StackRewind",
    "tagline": "Rewind the stack to the problem that created it."
  },
  "defaultRoute": { "volume": "networking", "chapter": "ch1" },
  "volumes": [
    {
      "id": "networking",
      "number": 1,
      "code": "net",
      "title": "Networking",
      "status": "published",
      "chapters": [
        {
          "id": "ch1",
          "number": 1,
          "era": "1960-1969",
          "title": "Why Packets Exist",
          "subtitle": "How computers learned to share a line.",
          "dataPath": "content/networking/chapter1.json"
        }
      ]
    }
  ]
}
```

- `dataPath` MUST point inside `content/<volumeId>/chapter<N>.json`.
- Volume `status`: `"published"` (selectable) or `"coming-soon"` (shown dimmed and non-interactive).

---

## 3. Self-Contained `chapter<N>.json` Schema

Each chapter owns its pages, bracket-free `tts` spoken scripts, and complete `codex` dictionary:

```json
{
  "volumeId": "networking",
  "chapterId": "ch1",
  "chapterNumber": 1,
  "assetPrefix": "net-ch1",
  "era": "1960-1969",
  "title": "Why Packets Exist",
  "subtitle": "How computers learned to share a line.",
  "pages": [
    {
      "page": 1,
      "panelType": "svg-scene",
      "sceneModule": "net-ch1-p01",
      "title": "The Briefing",
      "speaker": "The Guide",
      "dialogue": "Every [[Network Protocol|network-protocol]] is a set of rules.",
      "tts": "Every Network Protocol is a set of rules.",
      "sceneNotes": "16:9 visual choreography notes.",
      "deepDive": {
        "title": "Verified YouTube Video Title",
        "channel": "Channel Name",
        "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
        "focus": "One-sentence note on which mechanism this video unpacks."
      }
    }
  ],
  "codex": {
    "network-protocol": {
      "term": "Network Protocol",
      "plainEnglish": "Clear explanation without jargon.",
      "whyItWasInvented": "The real-world failure or crisis that demanded it.",
      "realWorldSighting": "Where engineers see this today."
    }
  }
}
```

- **`[[Display Term|term-id]]` Tokens**: Used in `dialogue` only. Every `term-id` MUST exist in `chapter.codex`.
- **`tts` Field**: Clean, bracket-free spoken narration matching `dialogue` (zero `[[` or `]]`).
- **Mechanism-First & Anti-Bloat Budget**: Follow **Problem → Concrete Mechanism → Result/Trade-Off** (`60–95` target words per page, strictly enforced `30–130` words after stripping `[[...|...]]` markup). Offload deeper step-by-step mechanics into `codex` entries (`>= 10` words each for `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`).

---

## 4. Standalone TTS Manifest & `edge_tts` Pipeline

Every chapter ships `content/<volumeId>/tts/<assetPrefix>-tts.json`:

```json
{
  "volumeId": "networking",
  "chapterId": "ch1",
  "assetPrefix": "net-ch1",
  "voice": "en-US-AndrewMultilingualNeural",
  "pages": [
    {
      "page": 1,
      "output": "assets/audio/net-ch1-p01.mp3",
      "text": "Every Network Protocol is a set of rules."
    }
  ]
}
```

- Standardized voice: `en-US-AndrewMultilingualNeural` at default natural rate and pitch (no `--rate` or `--pitch` flags).
- Synthesize audio:
  ```sh
  node scripts/generate-tts.mjs --chapter content/<volumeId>/chapter<N>.json --overwrite
  ```
- Preview exact `python -m edge_tts` commands without writing files:
  ```sh
  node scripts/generate-tts.mjs --chapter content/<volumeId>/chapter<N>.json --dry-run
  ```

---

## 5. Looping Dual-Theme `svg-scene` Contract

Location: `content/<volumeId>/scenes/<sceneModule>.js` (ES6 module).
Use `createLoopingScene` from `./looping-scene.js` so every scene renders a seamless continuous `960×540` loop and exports all 5 lifecycle hooks:

```js
export { mount, unmount, pause, resume, replay } // via createLoopingScene({ ... })
```

### CSS Sandboxing & Dual-Theme Tokens

- **Mandatory Selector Scoping:** Prefix CSS rules with `[data-scene="<sceneModule>"]` (handled automatically by `createLoopingScene`).
- **Dual-Theme `--sr-*` Tokens (Light & Dark):**
  - Surfaces: `--sr-bg-canvas`, `--sr-bg-surface`, `--sr-bg-elevated`
  - Borders: `--sr-border`, `--sr-border-strong`
  - Text: `--sr-ink`, `--sr-ink-secondary`, `--sr-ink-muted`
  - Accent: `--sr-amber`, `--sr-amber-soft`, plus `--scene-teal`, `--scene-crimson`, `--scene-paper-ink`
  - Fonts: `--sr-font-display`, `--sr-font-sans`, `--sr-font-mono`

---

## 6. Validation Gate

Run before committing or finishing any chapter:

```sh
node scripts/validate-cartridge.mjs
```

Validates single-root layout, manifest resolution, chapter schema, word-count density (`30–130` words per page `dialogue`/`tts`, `>= 10` words per `codex` field), codex coverage, bracket-free `tts` parity, 5 SVG lifecycle exports, `--sr-*` scoping, and `.mp3` audio files.

---

## 7. Localhost Multi-Model Authoring Studio (Free Web Chats)

If authoring through free-tier web chat accounts (**ChatGPT** for direction/script/JSON → **Gemini** for fact-checking → **Claude** strictly for SVG animations), launch the zero-dependency Studio GUI and no-cache live preview server:

```sh
python scripts/author-studio.py
```

- Opens `/studio` alongside the live local reader (`/#<volume>/<chapterId>/1`) with `Cache-Control: no-store`.
- Flags: `--port <int>` (default `8765`), `--no-open`, `--compact` (omits full exemplar SVG source in Claude prompts), `--exemplar <path>`.
- Saving Chapter JSON automatically synthesizes default `edge-tts` audio (`en-US-AndrewMultilingualNeural`) and offers optional Google AI Studio TTS upgrades (via Gemini API or free web `.wav`/`.mp3` import).
