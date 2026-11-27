#!/usr/bin/env python3
"""StackRewind Localhost Multi-Model Authoring Studio & No-Cache Preview Server.

Zero-dependency Python 3 stdlib tool that launches a complete localhost web GUI
(/studio) alongside a live no-cache preview of the StackRewind reader (/) to
orchestrate free-tier ChatGPT (direction/script/JSON), Gemini (fact-checking),
and Claude (strictly looping dual-theme SVG animations), save Cartridge files
safely under content/, synthesize default edge-tts audio (with optional Google
AI Studio narration upgrades), and validate Cartridges before committing.
"""

from __future__ import annotations

import argparse
import base64
import datetime as dt
import http.server
import io
import json
import os
from pathlib import Path
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import wave
import webbrowser

VOL_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CODE_RE = re.compile(r"^[a-z0-9]{2,4}$")
CH_ID_RE = re.compile(r"^ch\d+$")
SCENE_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*-p\d{2}$")
AUDIO_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*-p\d{2}\.mp3$")
TOKEN_RE = re.compile(r"\[\[([^\]|]+)\|([^\]]+)\]\]")

DEFAULT_VOICE = "en-US-AndrewMultilingualNeural"
DEFAULT_EXEMPLAR = "content/networking/scenes/net-ch1-p04.js"
GEMINI_TTS_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class StudioError(ValueError):
    """Domain validation error returned to the browser as HTTP 400."""


def strip_code_fences(raw: str) -> str:
    """Remove outer ```lang ... ``` markdown fences if a chat model wrapped its output."""
    text = (raw or "").strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].lstrip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def strip_codex_tokens(text: str) -> str:
    """Strip [[Display Term|term-id]] brackets down to spoken Display Term."""
    return TOKEN_RE.sub(r"\1", text or "").strip()


def count_words(text: str) -> int:
    plain = strip_codex_tokens(text)
    return len(plain.split()) if plain else 0


def safe_resolve(base_dir: Path, rel_path: str | Path) -> Path:
    """Resolve rel_path strictly inside base_dir, rejecting traversal or escapes."""
    base = base_dir.resolve()
    target = (base / rel_path).resolve()
    if not target.is_relative_to(base):
        raise StudioError(f"Path escapes allowed directory: {rel_path}")
    return target


def pcm_to_wav_bytes(pcm_bytes: bytes, sample_rate: int = 24000, channels: int = 1, sampwidth: int = 2) -> bytes:
    """Wrap raw signed 16-bit PCM bytes in a standard RIFF WAV header."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_bytes)
    return buf.getvalue()


def transcode_to_mp3(raw_bytes: bytes, ext_hint: str, dest_mp3: Path, ffmpeg_bin: str | None) -> None:
    """Write .mp3 directly or transcode .wav/.pcm bytes into dest_mp3 using ffmpeg."""
    dest_mp3.parent.mkdir(parents=True, exist_ok=True)
    ext = ext_hint.lower().lstrip(".")
    if ext == "mp3" and raw_bytes[:3] in (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        dest_mp3.write_bytes(raw_bytes)
        return
    if ext == "mp3" and not ffmpeg_bin:
        dest_mp3.write_bytes(raw_bytes)
        return
    if not ffmpeg_bin:
        raise StudioError(
            "ffmpeg is required on PATH to convert Gemini/AI Studio WAV or PCM audio into .mp3. "
            "Install ffmpeg or upload an .mp3 file directly."
        )
    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = Path(tmpdir) / f"input.{ext or 'wav'}"
        src_path.write_bytes(raw_bytes)
        cmd = [
            ffmpeg_bin,
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(src_path),
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "2",
            str(dest_mp3),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=False)
        if res.returncode != 0 or not dest_mp3.exists() or dest_mp3.stat().st_size == 0:
            raise StudioError(f"ffmpeg failed converting audio to MP3: {res.stderr.strip() or 'unknown error'}")


class StudioApp:
    """Core state, prompt builder, safe persistence, TTS, and validation backend."""

    def __init__(
        self,
        repo_root: Path,
        default_compact: bool = False,
        exemplar_rel: str = DEFAULT_EXEMPLAR,
    ) -> None:
        self.repo_root = Path(repo_root).resolve()
        self.content_dir = (self.repo_root / "content").resolve()
        self.assets_dir = (self.repo_root / "assets").resolve()
        self.audio_dir = (self.assets_dir / "audio").resolve()
        self.prompts_dir = (self.repo_root / "prompts").resolve()
        self.default_compact = default_compact
        self.exemplar_rel = exemplar_rel

    def _read_json(self, path: Path, default=None):
        if not path.exists():
            return default
        return json.loads(path.read_text(encoding="utf-8"))

    def _manifest(self) -> dict:
        manifest_path = self.content_dir / "manifest.json"
        data = self._read_json(manifest_path)
        if not isinstance(data, dict):
            raise StudioError("Missing or invalid content/manifest.json")
        return data

    def _previous_cliffhanger(self, volume_id: str, chapter_number: int) -> dict | None:
        if chapter_number <= 1 or not VOL_RE.match(volume_id):
            return None
        prev_path = safe_resolve(self.content_dir, f"{volume_id}/chapter{chapter_number - 1}.json")
        prev = self._read_json(prev_path)
        if not isinstance(prev, dict) or not prev.get("pages"):
            return None
        last_page = prev["pages"][-1]
        return {
            "chapterNumber": prev.get("chapterNumber", chapter_number - 1),
            "title": prev.get("title", ""),
            "era": prev.get("era", ""),
            "finalPageTitle": last_page.get("title", ""),
            "finalDialogue": strip_codex_tokens(last_page.get("dialogue", "")),
            "finalSceneNotes": last_page.get("sceneNotes", ""),
        }

    def _load_roadmap_entry(self, volume_id: str, chapter_number: int) -> dict | None:
        """Read content/<volume>/ROADMAP.md and extract the chapter brief + storyboard if present."""
        if not VOL_RE.match(volume_id) or chapter_number < 1:
            return None
        roadmap_path = safe_resolve(self.content_dir, f"{volume_id}/ROADMAP.md")
        if not roadmap_path.exists():
            return None
        text = roadmap_path.read_text(encoding="utf-8")
        sec_re = re.compile(
            rf"(?ms)^###\s+{chapter_number}\.\s+([^\r\n]+)\r?\n(.*?)(?=^###\s+\d+\.|^##\s+|\Z)"
        )
        m = sec_re.search(text)
        if not m:
            return None
        title = m.group(1).strip()
        brief = m.group(2).strip()
        era = ""
        era_m = re.match(r"^\*\*([^*]+?)\.\*\*", brief)
        if era_m:
            era = re.sub(r"\s*·\s*Published\s*$", "", era_m.group(1)).strip()

        sb_re = re.compile(
            rf"(?ims)^##\s+Chapter\s+{chapter_number}\s+storyboard\s+brief\b[^\r\n]*\r?\n(.*?)(?=^##\s+|\Z)"
        )
        sb_m = sb_re.search(text)
        storyboard = sb_m.group(1).strip() if sb_m else ""

        beat_rows = re.findall(r"(?m)^\|\s*\d+\s*\|", storyboard or brief)
        suggested_pages = len(beat_rows) if len(beat_rows) >= 2 else 6
        return {
            "path": f"content/{volume_id}/ROADMAP.md",
            "chapterNumber": chapter_number,
            "title": title,
            "era": era,
            "brief": brief,
            "storyboard": storyboard,
            "suggestedPages": suggested_pages,
        }

    def _chapter_file_status(self, volume_id: str, chapter_meta: dict) -> dict:
        data_rel = chapter_meta.get("dataPath", f"content/{volume_id}/chapter{chapter_meta.get('number', 1)}.json")
        ch_path = (self.repo_root / data_rel).resolve()
        ch_data = self._read_json(ch_path) if ch_path.exists() else None
        pages_status = []
        tts_rel = None
        tts_exists = False
        if isinstance(ch_data, dict):
            prefix = ch_data.get("assetPrefix", "")
            if prefix:
                tts_rel = f"content/{volume_id}/tts/{prefix}-tts.json"
                tts_exists = (self.repo_root / tts_rel).exists()
            for page in ch_data.get("pages", []):
                pnum = int(page.get("page", 0))
                pad = str(pnum).zfill(2)
                scene_mod = page.get("sceneModule", "")
                scene_rel = f"content/{volume_id}/scenes/{scene_mod}.js" if scene_mod else None
                audio_rel = f"assets/audio/{prefix}-p{pad}.mp3" if prefix else None
                scene_file = (self.repo_root / scene_rel) if scene_rel else None
                audio_file = (self.repo_root / audio_rel) if audio_rel else None
                pages_status.append(
                    {
                        "page": pnum,
                        "title": page.get("title", ""),
                        "sceneModule": scene_mod,
                        "scenePath": scene_rel,
                        "sceneExists": bool(scene_file and scene_file.exists() and scene_file.stat().st_size > 0),
                        "audioPath": audio_rel,
                        "audioExists": bool(audio_file and audio_file.exists() and audio_file.stat().st_size > 0),
                        "audioBytes": audio_file.stat().st_size if audio_file and audio_file.exists() else 0,
                        "tts": page.get("tts", ""),
                        "dialogueWords": count_words(page.get("dialogue", "")),
                        "ttsWords": count_words(page.get("tts", "")),
                    }
                )
        return {
            "id": chapter_meta.get("id"),
            "number": chapter_meta.get("number"),
            "era": chapter_meta.get("era"),
            "title": chapter_meta.get("title"),
            "subtitle": chapter_meta.get("subtitle"),
            "dataPath": data_rel,
            "exists": ch_path.exists(),
            "assetPrefix": ch_data.get("assetPrefix", "") if isinstance(ch_data, dict) else "",
            "ttsPath": tts_rel,
            "ttsExists": tts_exists,
            "pages": pages_status,
            "chapterJson": ch_data,
        }

    def get_state(self) -> dict:
        manifest = self._manifest()
        volumes_out = []
        for vol in manifest.get("volumes", []):
            vid = vol.get("id", "")
            chapters_out = [self._chapter_file_status(vid, ch) for ch in vol.get("chapters", [])]
            next_num = max([int(c.get("number", 0)) for c in vol.get("chapters", [])] or [0]) + 1
            code = vol.get("code", vid[:3])
            volumes_out.append(
                {
                    "id": vid,
                    "number": vol.get("number"),
                    "code": code,
                    "title": vol.get("title"),
                    "status": vol.get("status", "coming-soon"),
                    "nextChapterNumber": next_num,
                    "nextChapterId": f"ch{next_num}",
                    "nextAssetPrefix": f"{code}-ch{next_num}",
                    "prevCliffhanger": self._previous_cliffhanger(vid, next_num),
                    "nextRoadmap": self._load_roadmap_entry(vid, next_num),
                    "chapters": chapters_out,
                }
            )
        return {
            "brand": manifest.get("brand", {}),
            "defaultRoute": manifest.get("defaultRoute", {}),
            "volumes": volumes_out,
            "defaultCompact": self.default_compact,
            "ffmpegAvailable": bool(shutil.which("ffmpeg")),
            "nodeAvailable": bool(shutil.which("node")),
            "geminiKeyConfigured": bool(os.environ.get("GEMINI_API_KEY")),
        }

    def _save_prompt_file(self, stage: str, slug: str, content: str) -> str:
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        clean_slug = re.sub(r"[^a-z0-9_-]+", "-", slug.lower()).strip("-") or "prompt"
        target = safe_resolve(self.prompts_dir, f"{stamp}-{stage}-{clean_slug}.md")
        target.write_text(content, encoding="utf-8")
        return str(target.relative_to(self.repo_root)).replace("\\", "/")

    def build_chatgpt_prompt(self, payload: dict) -> dict:
        """Stage 1 prompt for Free ChatGPT: Volume Roadmap or Chapter Script & JSON."""
        target_type = payload.get("targetType", "chapter")
        manifest = self._manifest()

        if target_type == "volume":
            vol_id = (payload.get("volumeId") or "").strip()
            code = (payload.get("code") or "").strip()
            title = (payload.get("title") or "").strip()
            subtitle = (payload.get("subtitle") or "").strip()
            era_span = (payload.get("eraSpan") or "1960-2000").strip()
            chapter_count = int(payload.get("chapterCount") or 4)
            progression = (payload.get("progression") or "Strict causal chain: each chapter's trade-off triggers the next chapter's crisis").strip()
            if not VOL_RE.match(vol_id):
                raise StudioError("Volume slug must be kebab-case lowercase (e.g., operating-systems).")
            if not CODE_RE.match(code):
                raise StudioError("Volume code must be 2-4 lowercase alphanumeric characters (e.g., os, db).")
            if not title:
                raise StudioError("Volume display title is required.")

            next_vol_num = max([int(v.get("number", 0)) for v in manifest.get("volumes", [])] or [0]) + 1
            existing_vols = ", ".join(f"{v.get('id')} (#{v.get('number')}, {v.get('status')})" for v in manifest.get("volumes", []))
            prompt = f"""You are authoring a new **StackRewind** computing volume ("Rewind the stack to the problem that created it.").
Your job in THIS stage (Stage 1: Volume Direction & Roadmap) is to plan a cohesive, mechanism-first computing volume. Do NOT write SVG JavaScript files—Claude will handle SVG animations in Stage 3.

### Live Repository Context
- Existing volumes in `content/manifest.json`: {existing_vols}
- New Volume Identity:
  - `id`: `"{vol_id}"`
  - `number`: `{next_vol_num}`
  - `code`: `"{code}"`
  - `title`: `"{title}"`
  - `subtitle`: `"{subtitle or 'How foundational systems solved scaling crises step by step.'}"`
  - Historical arc: `{era_span}`
  - Planned chapter count: `{chapter_count}` chapters (`ch1` .. `ch{chapter_count}`)
  - Causal structure: {progression}

### Required Output Format
1. **Ordered Chapter Roadmap Table** with columns:
   `Chapter | Era | Engineering Problem | Concrete Mechanism | Causal Cliffhanger to Next Chapter | dataPath`
   (where `dataPath` follows `"content/{vol_id}/chapter<N>.json"`).
2. **`content/manifest.json` Volume Entry** as valid JSON inside a ```json fence (`status: "coming-soon"` initially, or `"published"` once Chapter 1 is ready).
3. **Chapter 1 Starter Brief**: 3-5 bullet points defining Chapter 1's opening bottleneck, concrete mechanism, key `codex` terms, and 6-page beat outline so we can generate `chapter1.json` next.
"""
            saved = self._save_prompt_file("chatgpt-volume", vol_id, prompt) if payload.get("saveFile", True) else None
            return {"prompt": prompt, "chars": len(prompt), "approxTokens": max(1, len(prompt) // 4), "savedPath": saved}

        # Chapter mode
        vol_id = (payload.get("volumeId") or "networking").strip()
        if not VOL_RE.match(vol_id):
            raise StudioError("Invalid volumeId slug.")
        ch_num = int(payload.get("chapterNumber") or 1)
        if ch_num < 1:
            raise StudioError("chapterNumber must be >= 1.")
        vol_meta = next((v for v in manifest.get("volumes", []) if v.get("id") == vol_id), None)
        code = (payload.get("code") or (vol_meta.get("code") if vol_meta else vol_id[:3]) or "vol").strip()
        asset_prefix = (payload.get("assetPrefix") or f"{code}-ch{ch_num}").strip()
        era = (payload.get("era") or "").strip()
        title = (payload.get("title") or "").strip()
        bottleneck = (payload.get("bottleneck") or "").strip()
        mechanisms = (payload.get("mechanisms") or "").strip()
        roadmap = self._load_roadmap_entry(vol_id, ch_num)
        page_count = int(payload.get("pageCount") or (roadmap["suggestedPages"] if roadmap else 6))
        codex_anchors = (payload.get("codexAnchors") or "").strip()
        visual_notes = (payload.get("visualNotes") or "").strip()
        if page_count < 2 or page_count > 12:
            raise StudioError("pageCount must be between 2 and 12.")
        if not roadmap and (not bottleneck or not mechanisms):
            raise StudioError("Core bottleneck and concrete mechanisms are required when no ROADMAP.md entry exists.")
        if roadmap:
            if not era and roadmap["era"]:
                era = roadmap["era"]
            if not title and roadmap["title"]:
                title = roadmap["title"]

        cliff = self._previous_cliffhanger(vol_id, ch_num)
        cliff_block = (
            f"""### Continuity from Chapter {cliff['chapterNumber']} ({cliff['title']}, {cliff['era']})
- Final Page Title: `{cliff['finalPageTitle']}`
- Final Spoken Hook: "{cliff['finalDialogue']}"
- Visual Cliffhanger: {cliff['finalSceneNotes']}
Pick up directly from this unresolved engineering crisis on Page 1."""
            if cliff
            else "### Continuity\nThis opens the chapter arc directly with the motivating real-world engineering failure."
        )

        roadmap_block = ""
        if roadmap:
            sb_part = f"\n\n#### Chapter {ch_num} Storyboard Brief\n{roadmap['storyboard']}" if roadmap["storyboard"] else ""
            roadmap_block = f"""\n### Authoritative Volume Roadmap Brief (`{roadmap['path']}` — Follow This Story)
- Assigned Title: **{roadmap['title']}** ({roadmap['era'] or era or 'TBD'})
{roadmap['brief']}{sb_part}
Follow this roadmap chapter's problem, concrete mechanism, design rationale, reader puzzle, and storyboard beats directly.\n"""

        prompt = f"""You are authoring **StackRewind** Chapter {ch_num} for volume `"{vol_id}"` ("Rewind the stack to the problem that created it.").
Your job in THIS stage (Stage 1: Direction, Mechanism-First Script & Cartridge JSON) is to generate **ONLY** `content/{vol_id}/chapter{ch_num}.json`. Do NOT generate SVG JavaScript scene files—another model (Claude) will craft the `960x540` looping SVG animations after Gemini fact-checks your JSON.

{cliff_block}
{roadmap_block}
### Chapter Brief
- `volumeId`: `"{vol_id}"`
- `chapterId`: `"ch{ch_num}"`
- `chapterNumber`: `{ch_num}`
- `assetPrefix`: `"{asset_prefix}"`
- `era`: `"{era or 'TBD historical span'}"`
- Working Title / Direction: `{title or 'Propose a crisp, concrete title and 1-sentence subtitle'}`
- Core Bottleneck / Failure Mode: {bottleneck or 'Follow the Authoritative Volume Roadmap Brief above'}
- Concrete Mechanisms to Unpack Step-by-Step: {mechanisms or 'Follow the Authoritative Volume Roadmap Brief and storyboard beats above'}
- Page Count: `{page_count}` pages (`page: 1` .. `{page_count}`, ending on a causal cliffhanger to the next chapter)
- Key Codex Anchors & Modern Sightings: {codex_anchors or 'Choose 7-10 concrete engineering terms with modern protocol/CLI sightings'}
- Visual Scene Direction (`sceneNotes`): {visual_notes or 'Describe crisp 16:9 cause-to-effect diagram states for each page'}

### Non-Negotiable StackRewind Cartridge Rules (Enforced by `validate-cartridge.mjs`)
1. Every page MUST follow **Problem -> Concrete Mechanism -> Result/Trade-Off** (headers, bits, queues, timers, state tables, relays—never generic hype).
2. Word budget per page: **`60-95` target words** (strict validator bounds `30-130` words after stripping `[[Display Term|term-id]]` tokens).
3. Inline Codex tokens in `dialogue` use `[[Display Term|term-id]]`; every `term-id` MUST exist in `chapter.codex`.
4. Every page's `tts` MUST match `dialogue` cleanly with **zero** `[[` or `]]` brackets and natural spoken punctuation (ready for `en-US-AndrewMultilingualNeural` at default speech rate).
5. Every `codex` entry MUST contain exact keys `term`, `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`, with **`>= 10` concrete words** in each of `plainEnglish`, `whyItWasInvented`, and `realWorldSighting`.
6. Every page MUST use `"panelType": "svg-scene"`, `"sceneModule": "{asset_prefix}-p<00>"` (zero-padded `p01`..`p{page_count:02d}`), `"speaker": "The Guide"`, a 1-paragraph `"sceneNotes"` describing the `960x540` visual states, and a `"deepDive"` object (`title`, `channel`, `url`, `focus`) targeting that page's core concept (if you cannot verify a YouTube URL live, provide a concrete `focus` + search note for Gemini Stage 2 to verify—never guess a YouTube video ID).

### Output Format
Return **one single valid JSON object** inside a ```json code block matching this exact schema:
```json
{{
  "volumeId": "{vol_id}",
  "chapterId": "ch{ch_num}",
  "chapterNumber": {ch_num},
  "assetPrefix": "{asset_prefix}",
  "era": "...",
  "title": "...",
  "subtitle": "...",
  "pages": [
    {{
      "page": 1,
      "panelType": "svg-scene",
      "sceneModule": "{asset_prefix}-p01",
      "title": "...",
      "speaker": "The Guide",
      "dialogue": "...",
      "tts": "...",
      "sceneNotes": "...",
      "deepDive": {{
        "title": "Exact YouTube Video Title",
        "channel": "Channel Name",
        "url": "https://www.youtube.com/watch?v=...",
        "focus": "One sentence on which concept this video unpacks deeply."
      }}
    }}
  ],
  "codex": {{
    "term-id": {{
      "term": "Display Term",
      "plainEnglish": ">= 10 words explaining concrete mechanics.",
      "whyItWasInvented": ">= 10 words on the specific failure that demanded it.",
      "realWorldSighting": ">= 10 words on where engineers inspect this today."
    }}
  }}
}}
```
"""
        saved = self._save_prompt_file("chatgpt-chapter", asset_prefix, prompt) if payload.get("saveFile", True) else None
        return {"prompt": prompt, "chars": len(prompt), "approxTokens": max(1, len(prompt) // 4), "savedPath": saved}

    def build_gemini_prompt(self, payload: dict) -> dict:
        """Stage 2 prompt for Free Gemini: 5-Dimension Fact-Check + Primary Sources & YouTube Deep-Dives."""
        vol_id = (payload.get("volumeId") or "").strip()
        ch_num = int(payload.get("chapterNumber") or 1)
        draft_text = strip_code_fences(payload.get("draftText") or "")
        if not draft_text and vol_id:
            ch_path = safe_resolve(self.content_dir, f"{vol_id}/chapter{ch_num}.json")
            if ch_path.exists():
                draft_text = ch_path.read_text(encoding="utf-8")
        if not draft_text:
            raise StudioError("Paste ChatGPT's chapter draft/JSON or select an existing saved chapter first.")

        slug = f"{vol_id or 'chapter'}-ch{ch_num}"
        roadmap = self._load_roadmap_entry(vol_id, ch_num) if vol_id else None
        roadmap_ref = (
            f"\n### Volume Roadmap Reference (`{roadmap['path']}`)\n"
            f"- Chapter {ch_num}: **{roadmap['title']}**\n"
            f"{roadmap['brief']}\n"
            if roadmap
            else ""
        )
        prompt = f"""You are running **StackRewind `/fact-check-chapter`** (Stage 2: Historical/Engineering Fact-Check, Primary Sources & YouTube Deep-Dives) on the Chapter JSON/draft pasted below.
Do NOT rewrite the whole chapter into textbook prose and do NOT generate SVG JavaScript code. Keep every page strictly within **`60-95` words** (`30-130` hard bounds) and preserve the **Problem -> Concrete Mechanism -> Result/Trade-Off** arc.
{roadmap_ref}

### Part A — Audit Across All 5 Mandatory Dimensions
1. **Historical Accuracy**: Verify years, chronological sequence, inventors, labs, standards bodies, and RFC/IEEE spec numbers.
2. **Step-by-Step Technical Mechanics**: Verify bits, header fields, frame boundaries, buffers, timers, state transitions, and lookup rules in `dialogue`, `tts`, and `codex.plainEnglish`.
3. **Causal Accuracy (`whyItWasInvented`)**: Ensure cited bottlenecks genuinely motivated the design rather than retrospective myths.
4. **Modern Accuracy (`realWorldSighting`)**: Verify modern protocols, Wireshark/CLI commands, and hardware behaviors actually work as stated today.
5. **SceneNotes-to-Dialogue Fidelity**: Verify every label, bit count, ratio, packet flow, and failure state in `sceneNotes` matches the prose and engineering reality.

### Part B — Deep-Dive Research & Grounding (Sources + YouTube)
1. **Authoritative Primary Sources**: Find **3-5 verified primary sources** (original papers, RFCs, IEEE specs, lab memos, or authoritative engineering docs) with real URLs and a 1-sentence note explaining which concrete mechanism in this chapter each source unpacks.
2. **Per-Page YouTube Deep-Dives (`page.deepDive`) + Chapter Videos**: Verify and populate **one dedicated YouTube deep-dive video inside EVERY page's `"deepDive"` object** (`title`, `channel`, `url`, `focus`) explaining that specific page's core concept deeply (e.g., Ben Eater, Computerphile, Neso Academy, CrashCourse, university lectures) so learners can study that concept before moving to the next page. Also verify 3-5 authoritative primary sources (papers, RFCs, IEEE specs).
3. **Strict Anti-Hallucination URL Rule**: Use live Search / YouTube grounding and **never guess or invent URLs or YouTube video IDs**. Every `deepDive.url` MUST be a real `https://www.youtube.com/watch?v=...` or `https://youtu.be/...` link verified live.

### Required Output
1. **Fact-Check Audit Table**:
   `| Claim | Location (Page / Codex / SceneNotes / DeepDive) | Verdict | Evidence / Fix |`
   using strictly `VERIFIED`, `IMPRECISE`, or `INCORRECT`, plus `Summary: <N> VERIFIED, <M> IMPRECISE, <K> INCORRECT`.
2. **Curated Primary Sources & Per-Page YouTube Deep-Dives** Markdown summary listing the verified links for each page.
3. **Complete Corrected `chapter{ch_num}.json`** inside a single ```json code block with:
   - `dialogue` and `tts` 100% synchronized (`tts` has zero `[[` or `]]` brackets),
   - all `[[Display Term|term-id]]` tokens resolved in `codex`,
   - every `codex` field `>= 10` words,
   - every page's `"deepDive": {{ "title", "channel", "url", "focus" }}` populated with a live-verified YouTube link,
   - an optional top-level `"furtherLearning"` array storing verified primary reading links cleanly:
     `"furtherLearning": [{{ "type": "paper" | "rfc" | "article" | "video", "title": "...", "creator": "...", "url": "https://...", "focus": "..." }}]`.

### Chapter Draft / JSON to Audit
```json
{draft_text}
```
"""
        saved = self._save_prompt_file("gemini-factcheck", slug, prompt) if payload.get("saveFile", True) else None
        return {"prompt": prompt, "chars": len(prompt), "approxTokens": max(1, len(prompt) // 4), "savedPath": saved}

    def _load_looping_contract(self) -> str:
        loop_path = self.content_dir / "networking" / "scenes" / "looping-scene.js"
        if not loop_path.exists():
            return "createLoopingScene({ id, description, artwork, duration, still, draw }) -> { mount, unmount, pause, resume, replay }"
        return loop_path.read_text(encoding="utf-8")

    def _load_exemplar(self) -> str:
        ex_path = safe_resolve(self.repo_root, self.exemplar_rel)
        if not ex_path.exists():
            return ""
        return ex_path.read_text(encoding="utf-8")

    def build_claude_prompts(self, payload: dict) -> dict:
        """Stage 3 prompts for Free Claude: per-scene standalone prompts + optional NEXT thread."""
        vol_id = (payload.get("volumeId") or "").strip()
        ch_num = int(payload.get("chapterNumber") or 1)
        compact = bool(payload.get("compact", self.default_compact))
        chapter_raw = strip_code_fences(payload.get("chapterText") or "")

        if chapter_raw:
            try:
                chapter = json.loads(chapter_raw)
            except json.JSONDecodeError as exc:
                raise StudioError(f"Invalid Chapter JSON for Claude Stage 3: {exc}") from exc
        else:
            if not VOL_RE.match(vol_id):
                raise StudioError("Provide valid volumeId or paste verified Chapter JSON.")
            ch_path = safe_resolve(self.content_dir, f"{vol_id}/chapter{ch_num}.json")
            chapter = self._read_json(ch_path)
            if not isinstance(chapter, dict):
                raise StudioError(f"Chapter JSON not found at content/{vol_id}/chapter{ch_num}.json. Save Chapter JSON first.")

        pages = chapter.get("pages") or []
        if not pages:
            raise StudioError("Chapter JSON has no pages[].")

        v_id = chapter.get("volumeId", vol_id)
        prefix = chapter.get("assetPrefix", f"{v_id}-ch{ch_num}")
        era = chapter.get("era", "")
        ch_title = chapter.get("title", "")
        exemplar_src = "" if compact else self._load_exemplar()
        exemplar_block = (
            f"\n### Reference Exemplar Scene (`{self.exemplar_rel}`)\n```js\n{exemplar_src}\n```\n"
            if exemplar_src
            else "\n*(Compact mode: full exemplar source omitted; follow `looping-scene.js` contract and token rules strictly.)*\n"
        )

        svg_rules = """### Non-Negotiable `design-svg-scene` & Validator Rules
1. Import strictly: `import { createLoopingScene, ease, lerp, windowPulse } from "./looping-scene.js";` (add `clamp` only if used).
2. Export strictly all 5 lifecycle hooks:
   `export const { mount, unmount, pause, resume, replay } = createLoopingScene({ id, description, artwork, duration, still, draw });`
3. Canvas & Safe Margins: `viewBox="0 0 960 540"`. Keep ALL cards, badges, wires, and labels inside `x: 36..924`, `y: 32..508`.
4. **Zero Overlapping Text (Critical)**:
   - Give headers, cards, moving packets, badges, and the bottom status strip (`y=456`, `height=48`) dedicated spatial lanes with `>= 12px` clearance.
   - Moving pills/packets must NOT cross over stationary card titles or labels.
   - Keep text crisp when scaled to mobile (`390x844`): prefer `font-size >= 10.5` for data labels and `>= 12` for status text.
5. **Dual-Theme Tokens Only** (works in both Warm Paper Noir Dark & Warm Paper Light):
   - Surfaces/borders: `.sc-card`, `.sc-panel`, `.sc-wire`, `.sc-amber-wire`, `--sr-bg-surface`, `--sr-bg-canvas`, `--sr-border`, `--sr-border-strong`
   - Ink/fonts: `.sc-title`, `.sc-mono`, `--sr-ink`, `--sr-ink-secondary`, `--sr-ink-muted`
   - Accents: `--sr-amber`, `--scene-teal`, `--scene-teal-soft`, `--scene-crimson`, `--scene-crimson-soft`, `--scene-paper-ink` (text inside solid accent fills)
   - Never hardcode light-only or dark-only hex colors; prefix any custom `<style>` rules with `[data-scene="<id>"]`.
6. **Seamless Continuous Loop**: `draw(parts, time)` must return smoothly from `t = duration` back to `t = 0` (using `ease`, `windowPulse`, or end fades) with zero DOM rebuilds per frame—only mutate `data-part` attributes (`transform`, `opacity`, `width`, `stroke`, `textContent`)."""

        loop_contract = """### `looping-scene.js` Helper Exports
- `clamp(value, min = 0, max = 1)`
- `lerp(a, b, t)`
- `ease(time, start, end)` (smoothstep 0..1)
- `windowPulse(time, start, peak, end)` (smoothly rises `start->peak` and falls `peak->end`)
- Built-in CSS classes scoped to `[data-scene="<id>"]`: `.sc-card`, `.sc-panel`, `.sc-wire`, `.sc-amber-wire`, `.sc-mono`, `.sc-title`"""

        scene_prompts = []
        for page in pages:
            pnum = int(page.get("page", 0))
            pad = str(pnum).zfill(2)
            scene_id = page.get("sceneModule") or f"{prefix}-p{pad}"
            target_path = f"content/{v_id}/scenes/{scene_id}.js"
            p_title = page.get("title", f"Page {pnum}")
            dialogue_plain = strip_codex_tokens(page.get("dialogue", ""))
            scene_notes = page.get("sceneNotes", "")

            per_prompt = f"""You are crafting **ONE** StackRewind looping dual-theme SVG animation module (`{target_path}`).
Focus **strictly on this single SVG scene JS module**—do NOT output JSON files or multiple scenes.

### Chapter & Page Context
- Volume/Chapter: `{v_id}` · `{ch_title}` ({era})
- Scene ID (`id` and filename): `"{scene_id}"` -> save to `{target_path}`
- Page {pnum} of {len(pages)}: **{p_title}**
- Spoken Narration: "{dialogue_plain}"
- Visual Choreography (`sceneNotes`): {scene_notes}

{loop_contract}

{svg_rules}
{exemplar_block}
### Output Format
Output **only** the complete ES6 module code for `{target_path}` inside a single ```js code block, starting with `import {{ createLoopingScene, ... }} from "./looping-scene.js";` and ending with `export const {{ mount, unmount, pause, resume, replay }} = createLoopingScene({{ ... }});`.
"""
            scene_prompts.append(
                {
                    "page": pnum,
                    "sceneModule": scene_id,
                    "targetPath": target_path,
                    "title": p_title,
                    "prompt": per_prompt,
                    "chars": len(per_prompt),
                    "approxTokens": max(1, len(per_prompt) // 4),
                }
            )

        # Optional single staged "NEXT" prompt covering all pages sequentially
        pages_spec = "\n".join(
            f"- **Turn {i + 1} (`{sp['targetPath']}`, `id: \"{sp['sceneModule']}\"`):** {pages[i].get('title', '')}\n"
            f"  - Narration: \"{strip_codex_tokens(pages[i].get('dialogue', ''))}\"\n"
            f"  - SceneNotes: {pages[i].get('sceneNotes', '')}"
            for i, sp in enumerate(scene_prompts)
        )
        staged_prompt = f"""You are crafting **ONLY** the `{len(scene_prompts)}` looping dual-theme SVG scene JS modules for StackRewind chapter `"{v_id}"` / `"{ch_title}"` ({era}).
To stay well inside output limits, act as a strict **Turn-by-Turn State Machine**:
- On **Turn 1** (this reply), output **ONLY** `{scene_prompts[0]['targetPath']}` inside one ```js block, then STOP and write: `READY FOR NEXT (send "NEXT" for Page 2)`.
- Whenever the user replies `"NEXT"`, output **ONLY** the next scene module in order, then STOP again until all `{len(scene_prompts)}` scenes are delivered.

{loop_contract}

{svg_rules}
{exemplar_block}
### Scene Queue
{pages_spec}
"""
        saved = self._save_prompt_file("claude-svg-staged", prefix, staged_prompt) if payload.get("saveFile", True) else None
        return {
            "volumeId": v_id,
            "assetPrefix": prefix,
            "compact": compact,
            "scenes": scene_prompts,
            "stagedPrompt": staged_prompt,
            "stagedChars": len(staged_prompt),
            "stagedApproxTokens": max(1, len(staged_prompt) // 4),
            "savedPath": saved,
        }

    def save_volume(self, payload: dict) -> dict:
        """Scaffold a new volume under content/<volume>/ and register it in manifest.json."""
        raw_text = strip_code_fences(payload.get("volumeJson") or "")
        vol_data = None
        if raw_text:
            try:
                vol_data = json.loads(raw_text)
            except json.JSONDecodeError as exc:
                raise StudioError(f"Invalid Volume JSON: {exc}") from exc
        else:
            vol_data = {
                "id": (payload.get("volumeId") or "").strip(),
                "code": (payload.get("code") or "").strip(),
                "title": (payload.get("title") or "").strip(),
                "status": payload.get("status") or "coming-soon",
                "chapters": [],
            }

        vol_id = (vol_data.get("id") or "").strip()
        code = (vol_data.get("code") or "").strip()
        title = (vol_data.get("title") or "").strip()
        if not VOL_RE.match(vol_id):
            raise StudioError("Volume id must be lowercase kebab-case (e.g., operating-systems).")
        if not CODE_RE.match(code):
            raise StudioError("Volume code must be 2-4 lowercase alphanumeric characters.")
        if not title:
            raise StudioError("Volume title is required.")

        vol_dir = safe_resolve(self.content_dir, vol_id)
        scenes_dir = safe_resolve(vol_dir, "scenes")
        tts_dir = safe_resolve(vol_dir, "tts")
        scenes_dir.mkdir(parents=True, exist_ok=True)
        tts_dir.mkdir(parents=True, exist_ok=True)

        src_loop = self.content_dir / "networking" / "scenes" / "looping-scene.js"
        dst_loop = scenes_dir / "looping-scene.js"
        if src_loop.exists() and not dst_loop.exists():
            shutil.copyfile(src_loop, dst_loop)
        gitkeep = tts_dir / ".gitkeep"
        if not any(tts_dir.iterdir()):
            gitkeep.write_text("", encoding="utf-8")

        manifest = self._manifest()
        volumes = manifest.setdefault("volumes", [])
        existing = next((v for v in volumes if v.get("id") == vol_id), None)
        next_num = max([int(v.get("number", 0)) for v in volumes] or [0]) + 1
        entry = {
            "id": vol_id,
            "number": int(vol_data.get("number") or next_num),
            "code": code,
            "title": title,
            "status": vol_data.get("status") if vol_data.get("status") in ("published", "coming-soon") else "coming-soon",
            "chapters": vol_data.get("chapters") if isinstance(vol_data.get("chapters"), list) else [],
        }
        if existing:
            existing.update(entry)
        else:
            volumes.append(entry)

        manifest_path = safe_resolve(self.content_dir, "manifest.json")
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return {"ok": True, "volumeId": vol_id, "manifestPath": "content/manifest.json"}

    def save_chapter(self, payload: dict) -> dict:
        """Validate & save chapter<N>.json, sync tts/<prefix>-tts.json & manifest.json, and run default edge-tts."""
        raw_text = strip_code_fences(payload.get("chapterJson") or "")
        if not raw_text:
            raise StudioError("Paste Chapter JSON before saving.")
        try:
            ch = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise StudioError(f"Invalid Chapter JSON: {exc}") from exc
        if not isinstance(ch, dict):
            raise StudioError("Chapter JSON root must be a JSON object.")

        for req in ("volumeId", "chapterId", "chapterNumber", "assetPrefix", "era", "title", "subtitle", "pages", "codex"):
            if ch.get(req) in (None, "", []):
                raise StudioError(f'Missing required chapter field "{req}".')

        vol_id = str(ch["volumeId"]).strip()
        ch_id = str(ch["chapterId"]).strip()
        ch_num = int(ch["chapterNumber"])
        prefix = str(ch["assetPrefix"]).strip()
        if not VOL_RE.match(vol_id):
            raise StudioError(f"Invalid volumeId: {vol_id}")
        if not CH_ID_RE.match(ch_id):
            raise StudioError(f"Invalid chapterId: {ch_id} (expected ch<N>)")
        if not re.match(r"^[a-z0-9-]+$", prefix):
            raise StudioError(f"Invalid assetPrefix: {prefix}")
        if not isinstance(ch["pages"], list) or len(ch["pages"]) == 0:
            raise StudioError("Chapter pages must be a non-empty array.")

        # Ensure volume scenes/looping-scene.js exists if this is a brand-new volume
        vol_dir = safe_resolve(self.content_dir, vol_id)
        scenes_dir = safe_resolve(vol_dir, "scenes")
        tts_dir = safe_resolve(vol_dir, "tts")
        scenes_dir.mkdir(parents=True, exist_ok=True)
        tts_dir.mkdir(parents=True, exist_ok=True)
        src_loop = self.content_dir / "networking" / "scenes" / "looping-scene.js"
        dst_loop = scenes_dir / "looping-scene.js"
        if src_loop.exists() and not dst_loop.exists():
            shutil.copyfile(src_loop, dst_loop)

        ch_rel = f"content/{vol_id}/chapter{ch_num}.json"
        ch_path = safe_resolve(self.content_dir, f"{vol_id}/chapter{ch_num}.json")
        ch_path.write_text(json.dumps(ch, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        # Auto-generate synchronized standalone TTS manifest
        tts_pages = []
        for page in ch["pages"]:
            pnum = int(page.get("page", 0))
            pad = str(pnum).zfill(2)
            tts_text = strip_codex_tokens(page.get("tts") or page.get("dialogue") or "")
            page["tts"] = tts_text
            tts_pages.append(
                {
                    "page": pnum,
                    "output": f"assets/audio/{prefix}-p{pad}.mp3",
                    "text": tts_text,
                }
            )
        ch_path.write_text(json.dumps(ch, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        tts_manifest = {
            "volumeId": vol_id,
            "chapterId": ch_id,
            "assetPrefix": prefix,
            "voice": DEFAULT_VOICE,
            "pages": tts_pages,
        }
        tts_rel = f"content/{vol_id}/tts/{prefix}-tts.json"
        tts_path = safe_resolve(self.content_dir, f"{vol_id}/tts/{prefix}-tts.json")
        tts_path.write_text(json.dumps(tts_manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        # Update content/manifest.json
        manifest = self._manifest()
        volumes = manifest.setdefault("volumes", [])
        vol_entry = next((v for v in volumes if v.get("id") == vol_id), None)
        if not vol_entry:
            next_num = max([int(v.get("number", 0)) for v in volumes] or [0]) + 1
            code = prefix.split("-")[0] if "-" in prefix else vol_id[:3]
            vol_entry = {
                "id": vol_id,
                "number": next_num,
                "code": code,
                "title": vol_id.replace("-", " ").title(),
                "status": "published",
                "chapters": [],
            }
            volumes.append(vol_entry)
        else:
            vol_entry["status"] = "published"

        chapters = vol_entry.setdefault("chapters", [])
        ch_meta = {
            "id": ch_id,
            "number": ch_num,
            "era": str(ch["era"]),
            "title": str(ch["title"]),
            "subtitle": str(ch["subtitle"]),
            "dataPath": ch_rel,
        }
        existing_idx = next((i for i, c in enumerate(chapters) if c.get("id") == ch_id or c.get("number") == ch_num), None)
        if existing_idx is not None:
            chapters[existing_idx] = ch_meta
        else:
            chapters.append(ch_meta)
            chapters.sort(key=lambda c: int(c.get("number", 0)))

        manifest_path = safe_resolve(self.content_dir, "manifest.json")
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        tts_result = None
        if payload.get("autoTts", True):
            tts_result = self.run_edge_tts(ch_rel, overwrite=True)

        return {
            "ok": True,
            "chapterPath": ch_rel,
            "ttsPath": tts_rel,
            "manifestPath": "content/manifest.json",
            "ttsResult": tts_result,
        }

    def save_scene(self, payload: dict) -> dict:
        """Validate & save a single SVG scene JS module strictly under content/<volume>/scenes/."""
        vol_id = (payload.get("volumeId") or "").strip()
        scene_mod = (payload.get("sceneModule") or "").strip()
        code = strip_code_fences(payload.get("sceneCode") or "")

        if not VOL_RE.match(vol_id):
            raise StudioError(f"Invalid volumeId: {vol_id}")
        if not SCENE_RE.match(scene_mod):
            raise StudioError(f"Invalid sceneModule '{scene_mod}' (expected <prefix>-p01 format).")
        if not code:
            raise StudioError("Paste SVG scene JS code before saving.")
        if "createLoopingScene" not in code and "data-scene" not in code:
            raise StudioError("Scene module must use createLoopingScene() or [data-scene] scoping.")
        if "--sr-" not in code:
            raise StudioError("Scene module must consume --sr-* theme tokens for Dark & Light mode.")

        target = safe_resolve(self.content_dir, f"{vol_id}/scenes/{scene_mod}.js")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(code.rstrip() + "\n", encoding="utf-8")
        return {"ok": True, "scenePath": f"content/{vol_id}/scenes/{scene_mod}.js"}

    def save_audio(self, payload: dict) -> dict:
        """Save or transcode uploaded .wav/.mp3 audio strictly to assets/audio/<prefix>-p<00>.mp3."""
        filename = (payload.get("filename") or "").strip()
        b64_data = (payload.get("audioBase64") or "").strip()
        source_ext = (payload.get("sourceExt") or "wav").strip().lower().lstrip(".")
        if not AUDIO_NAME_RE.match(filename):
            raise StudioError(f"Invalid audio filename '{filename}' (expected <assetPrefix>-p01.mp3).")
        if not b64_data:
            raise StudioError("Missing audioBase64 payload.")
        if "," in b64_data and b64_data.startswith("data:"):
            b64_data = b64_data.split(",", 1)[1]
        try:
            raw_bytes = base64.b64decode(b64_data, validate=True)
        except Exception as exc:
            raise StudioError(f"Invalid base64 audio payload: {exc}") from exc

        dest = safe_resolve(self.audio_dir, filename)
        transcode_to_mp3(raw_bytes, source_ext, dest, shutil.which("ffmpeg"))
        return {"ok": True, "audioPath": f"assets/audio/{filename}", "bytes": dest.stat().st_size}

    def _resolve_chapter_rel(self, payload: dict) -> str:
        rel = (payload.get("chapterPath") or "").strip().replace("\\", "/")
        if not rel:
            vol_id = (payload.get("volumeId") or "").strip()
            ch_num = int(payload.get("chapterNumber") or 0)
            if not VOL_RE.match(vol_id) or ch_num < 1:
                raise StudioError("Provide chapterPath or valid volumeId + chapterNumber.")
            rel = f"content/{vol_id}/chapter{ch_num}.json"
        if not rel.startswith("content/") or not rel.endswith(".json"):
            raise StudioError("chapterPath must live under content/<volume>/chapter<N>.json.")
        resolved = safe_resolve(self.content_dir, rel[len("content/"):])
        if not resolved.exists():
            raise StudioError(f"Chapter file does not exist yet: {rel}")
        return rel

    def run_edge_tts(self, chapter_rel: str, page: int | None = None, overwrite: bool = True) -> dict:
        """Run default edge-tts synthesis page-by-page with paced retries to avoid endpoint throttling."""
        node_bin = shutil.which("node")
        if not node_bin:
            return {
                "ok": False,
                "provider": "edge-tts",
                "exitCode": 1,
                "stdout": "",
                "stderr": "Node.js (`node`) was not found on PATH to execute scripts/generate-tts.mjs.",
            }
        ch_path = safe_resolve(self.content_dir, chapter_rel[len("content/"):])
        ch = self._read_json(ch_path)
        pages = [int(p["page"]) for p in ch.get("pages", [])]
        if page is not None:
            pages = [p for p in pages if p == int(page)]
            if not pages:
                raise StudioError(f"Page {page} not found in {chapter_rel}.")

        logs: list[str] = []
        for idx, pnum in enumerate(pages):
            succeeded = False
            last_err = ""
            for attempt in range(1, 4):
                cmd = [node_bin, "scripts/generate-tts.mjs", "--chapter", chapter_rel, "--page", str(pnum)]
                if overwrite:
                    cmd.append("--overwrite")
                res = subprocess.run(cmd, cwd=self.repo_root, capture_output=True, text=True, check=False)
                out = (res.stdout or "").strip()
                err = (res.stderr or "").strip()
                if res.returncode == 0 and "edge_tts CLI not found" not in err:
                    if out:
                        logs.append(out)
                    succeeded = True
                    break
                last_err = err or out or f"exit {res.returncode}"
                if "edge_tts CLI not found" in err:
                    return {
                        "ok": False,
                        "provider": "edge-tts",
                        "exitCode": 1,
                        "stdout": "\n".join(logs),
                        "stderr": last_err,
                    }
                if attempt < 3:
                    time.sleep(2.0)
            if not succeeded:
                return {
                    "ok": False,
                    "provider": "edge-tts",
                    "exitCode": 1,
                    "stdout": "\n".join(logs),
                    "stderr": f"Page {pnum} failed after 3 edge-tts attempts: {last_err}",
                }
            if idx < len(pages) - 1:
                time.sleep(1.0)

        return {
            "ok": True,
            "provider": "edge-tts",
            "voice": DEFAULT_VOICE,
            "exitCode": 0,
            "stdout": "\n".join(logs),
            "stderr": "",
        }

    def run_google_ai_studio_tts(
        self,
        chapter_rel: str,
        api_key: str = "",
        model: str = "gemini-2.5-flash-tts",
        voice_name: str = "Kore",
        style_prompt: str = "",
        page: int | None = None,
    ) -> dict:
        """Optional narration upgrade using Google AI Studio (Gemini generateContent AUDIO API)."""
        key = (api_key or "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()
        if not key:
            raise StudioError(
                "Missing GEMINI_API_KEY. Set GEMINI_API_KEY in your environment, paste a session key, "
                "or use the free Google AI Studio Web Audio Import below."
            )
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            raise StudioError("ffmpeg is required on PATH to encode Google AI Studio audio to .mp3.")

        ch_path = safe_resolve(self.content_dir, chapter_rel[len("content/"):])
        ch = self._read_json(ch_path)
        prefix = ch["assetPrefix"]
        vol_id = ch["volumeId"]
        tts_path = safe_resolve(self.content_dir, f"{vol_id}/tts/{prefix}-tts.json")
        tts_data = self._read_json(tts_path) if tts_path.exists() else None
        source_pages = (tts_data or ch).get("pages", [])
        if page is not None:
            source_pages = [p for p in source_pages if int(p.get("page", 0)) == int(page)]
            if not source_pages:
                raise StudioError(f"Page {page} not found in {chapter_rel}.")

        logs: list[str] = []
        clean_model = re.sub(r"[^a-zA-Z0-9._-]+", "", model or "gemini-2.5-flash-tts")
        url = GEMINI_TTS_ENDPOINT.format(model=clean_model)

        for entry in source_pages:
            pnum = int(entry["page"])
            pad = str(pnum).zfill(2)
            text = strip_codex_tokens(entry.get("text") or entry.get("tts") or "")
            spoken_prompt = f"{style_prompt.strip()}\n\n{text}" if style_prompt.strip() else text
            body = json.dumps(
                {
                    "contents": [{"parts": [{"text": spoken_prompt}]}],
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {"voiceName": (voice_name or "Kore").strip()}
                            }
                        },
                    },
                }
            ).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=body,
                method="POST",
                headers={"Content-Type": "application/json", "x-goog-api-key": key},
            )
            try:
                with urllib.request.urlopen(req, timeout=90) as resp:
                    resp_json = json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                err_body = exc.read().decode("utf-8", errors="replace")
                raise StudioError(f"Google AI Studio HTTP {exc.code} on page {pnum}: {err_body[:300]}") from exc
            except urllib.error.URLError as exc:
                raise StudioError(f"Google AI Studio request failed on page {pnum}: {exc.reason}") from exc

            inline = None
            for cand in resp_json.get("candidates", []):
                for part in cand.get("content", {}).get("parts", []):
                    if "inlineData" in part and part["inlineData"].get("data"):
                        inline = part["inlineData"]
                        break
                if inline:
                    break
            if not inline:
                raise StudioError(f"Google AI Studio returned no inline audio data for page {pnum}.")

            mime = (inline.get("mimeType") or "audio/L16;rate=24000").lower()
            raw_audio = base64.b64decode(inline["data"])
            if "l16" in mime or "pcm" in mime:
                rate_match = re.search(r"rate=(\d+)", mime)
                rate = int(rate_match.group(1)) if rate_match else 24000
                raw_audio = pcm_to_wav_bytes(raw_audio, sample_rate=rate)
                ext_hint = "wav"
            elif "wav" in mime:
                ext_hint = "wav"
            elif "mpeg" in mime or "mp3" in mime:
                ext_hint = "mp3"
            else:
                ext_hint = "wav"

            dest_name = f"{prefix}-p{pad}.mp3"
            dest_mp3 = safe_resolve(self.audio_dir, dest_name)
            transcode_to_mp3(raw_audio, ext_hint, dest_mp3, ffmpeg_bin)
            logs.append(f"[google-ai-studio] Wrote assets/audio/{dest_name} ({dest_mp3.stat().st_size} bytes)")

        return {
            "ok": True,
            "provider": "google-ai-studio",
            "model": clean_model,
            "voice": voice_name,
            "exitCode": 0,
            "stdout": "\n".join(logs),
            "stderr": "",
        }

    def run_tts(self, payload: dict) -> dict:
        chapter_rel = self._resolve_chapter_rel(payload)
        provider = (payload.get("provider") or "edge-tts").strip().lower()
        page = int(payload["page"]) if payload.get("page") not in (None, "", 0) else None
        if provider == "google-ai-studio":
            return self.run_google_ai_studio_tts(
                chapter_rel=chapter_rel,
                api_key=payload.get("apiKey") or "",
                model=payload.get("model") or "gemini-2.5-flash-tts",
                voice_name=payload.get("voiceName") or "Kore",
                style_prompt=payload.get("stylePrompt") or "",
                page=page,
            )
        return self.run_edge_tts(chapter_rel=chapter_rel, page=page, overwrite=bool(payload.get("overwrite", True)))

    def run_validate(self, payload: dict | None = None) -> dict:
        node_bin = shutil.which("node")
        if not node_bin:
            return {"ok": False, "exitCode": 1, "stdout": "", "stderr": "Node.js (`node`) not found on PATH."}
        cmd = [node_bin, "scripts/validate-cartridge.mjs"]
        if payload and payload.get("allowMissingAudio"):
            cmd.append("--allow-missing-audio")
        res = subprocess.run(cmd, cwd=self.repo_root, capture_output=True, text=True, check=False)
        return {
            "ok": res.returncode == 0,
            "exitCode": res.returncode,
            "stdout": (res.stdout or "").strip(),
            "stderr": (res.stderr or "").strip(),
        }


STUDIO_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StackRewind — Multi-Model Authoring Studio</title>
  <style>
    :root {
      --bg: #14100b;
      --surface: #1d1915;
      --elevated: #26211c;
      --border: rgba(243, 237, 226, 0.14);
      --ink: #f3ede2;
      --muted: #b7aa97;
      --amber: #e5a44d;
      --amber-ink: #16110a;
      --teal: #4fd1c5;
      --crimson: #ef5350;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      --sans: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: rgba(20, 16, 11, 0.94);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand { font-weight: 700; font-size: 1.05rem; letter-spacing: 0.02em; }
    .brand span { color: var(--amber); font-family: var(--mono); font-size: 0.85rem; margin-left: 8px; }
    .topbar-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    select, input, textarea {
      background: var(--bg);
      color: var(--ink);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 10px;
      font-family: var(--sans);
      font-size: 0.9rem;
      width: 100%;
    }
    textarea { font-family: var(--mono); font-size: 0.8rem; min-height: 140px; resize: vertical; }
    select.inline-select { width: auto; min-width: 210px; }
    .btn {
      cursor: pointer;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--elevated);
      color: var(--ink);
      padding: 8px 14px;
      font-weight: 600;
      font-size: 0.86rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { border-color: var(--amber); }
    .btn-primary { background: var(--amber); color: var(--amber-ink); border-color: var(--amber); }
    .btn-teal { background: rgba(79, 209, 197, 0.14); color: var(--teal); border-color: var(--teal); }
    .pill {
      font-family: var(--mono);
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--muted);
    }
    .pill.ok { border-color: var(--teal); color: var(--teal); }
    .pill.warn { border-color: var(--amber); color: var(--amber); }
    .pill.err { border-color: var(--crimson); color: var(--crimson); }
    main { max-width: 1200px; margin: 0 auto; padding: 18px 20px 60px; }
    .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .tab-btn {
      cursor: pointer;
      padding: 9px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      font-weight: 600;
      font-size: 0.88rem;
    }
    .tab-btn.active { background: var(--elevated); color: var(--amber); border-color: var(--amber); }
    .panel { display: none; }
    .panel.active { display: block; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .card h2, .card h3 { margin: 0 0 10px; font-size: 1rem; color: var(--amber); }
    label { display: block; font-size: 0.8rem; color: var(--muted); margin: 10px 0 4px; font-family: var(--mono); }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 10px; }
    .row-between { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; }
    .log {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--mono);
      font-size: 0.78rem;
      white-space: pre-wrap;
      max-height: 240px;
      overflow: auto;
      color: var(--muted);
    }
    .scene-card { background: var(--elevated); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 12px; }
    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.86rem; }
    .checkbox-row input { width: auto; }
    .small { font-size: 0.8rem; color: var(--muted); }
  </style>
</head>
<body>
  <header>
    <div class="brand">StackRewind <span>LOCALHOST AUTHORING STUDIO</span></div>
    <div class="topbar-actions">
      <select id="active-target" class="inline-select" aria-label="Active Volume and Chapter"></select>
      <a id="preview-link" class="btn btn-teal" href="/#networking/ch2/1" target="_blank" rel="noopener">Open Live Local Preview</a>
      <button id="top-validate-btn" class="btn" type="button">Validate Cartridge</button>
      <span id="top-status-pill" class="pill">Ready</span>
    </div>
  </header>

  <main>
    <nav class="tabs" role="tablist">
      <button class="tab-btn active" data-tab="chatgpt">1. Free ChatGPT (Direction &amp; JSON)</button>
      <button class="tab-btn" data-tab="gemini">2. Free Gemini (Fact-Check &amp; Deep-Dives)</button>
      <button class="tab-btn" data-tab="claude">3. Free Claude (SVG Scenes Only)</button>
      <button class="tab-btn" data-tab="audio">4. Audio (edge-tts / AI Studio) &amp; Preview</button>
    </nav>

    <!-- STAGE 1: FREE CHATGPT -->
    <section id="tab-chatgpt" class="panel active">
      <div class="grid">
        <div class="card">
          <h2>Stage 1A · Interview Form (Free ChatGPT)</h2>
          <label>Authoring Target</label>
          <select id="cg-target-type">
            <option value="chapter">New Chapter (or Rewrite)</option>
            <option value="volume">New Computing Volume Roadmap</option>
          </select>

          <div id="cg-chapter-fields">
            <label>Volume Slug</label>
            <input id="cg-vol" value="networking" />
            <div class="grid">
              <div>
                <label>Chapter #</label>
                <input id="cg-chnum" type="number" min="1" value="3" />
              </div>
              <div>
                <label>Asset Prefix</label>
                <input id="cg-prefix" value="net-ch3" />
              </div>
              <div>
                <label>Pages (Default 6)</label>
                <input id="cg-pages" type="number" min="2" max="12" value="6" />
              </div>
            </div>
            <label>Historical Era</label>
            <input id="cg-era" placeholder="e.g., 1974-1983" />
            <label>Working Chapter Title / Direction (optional)</label>
            <input id="cg-title" placeholder="e.g., Bridging the Islands: TCP/IP" />
            <label>Core Bottleneck / Crisis</label>
            <textarea id="cg-bottleneck" style="min-height:70px" placeholder="What failed in the previous system?"></textarea>
            <label>Concrete Mechanisms to Unpack</label>
            <textarea id="cg-mechanisms" style="min-height:70px" placeholder="Headers, routing tables, sliding windows, sequence numbers..."></textarea>
            <label>Key Codex Anchors &amp; Modern Sightings</label>
            <input id="cg-codex" placeholder="e.g., ip-datagram, router, tcp-handshake (Wireshark, traceroute)" />
            <label>Visual Choreography Hints (optional)</label>
            <input id="cg-visual" placeholder="e.g., incompatible network islands bridged by IP gateway" />
          </div>

          <div id="cg-volume-fields" style="display:none">
            <label>New Volume Slug (kebab-case)</label>
            <input id="cg-new-vol" placeholder="e.g., databases" />
            <div class="grid">
              <div>
                <label>Short Code (2-4 chars)</label>
                <input id="cg-new-code" placeholder="db" />
              </div>
              <div>
                <label>Chapter Count (3-5)</label>
                <input id="cg-new-count" type="number" min="3" max="5" value="4" />
              </div>
            </div>
            <label>Display Title</label>
            <input id="cg-new-title" placeholder="Databases" />
            <label>Subtitle</label>
            <input id="cg-new-sub" placeholder="How disks learned to survive crashes and concurrent users." />
            <label>Historical Span</label>
            <input id="cg-new-era" placeholder="1960-1995" />
            <label>Causal Progression Notes</label>
            <input id="cg-new-prog" value="Strict causal chain: each chapter's trade-off triggers the next chapter's crisis" />
          </div>

          <div class="row">
            <button id="gen-chatgpt-btn" class="btn btn-primary" type="button">Generate ChatGPT Prompt</button>
            <button id="copy-chatgpt-btn" class="btn" type="button">Copy Prompt</button>
            <span id="cg-meta" class="small"></span>
          </div>
        </div>

        <div class="card">
          <h2>Stage 1B · ChatGPT Prompt &amp; Paste Output</h2>
          <label>Generated Prompt (Paste into Free ChatGPT)</label>
          <textarea id="cg-prompt-out" readonly placeholder="Click 'Generate ChatGPT Prompt' to build a repo-grounded prompt..."></textarea>

          <label>Paste ChatGPT Output (Chapter JSON or Volume JSON)</label>
          <textarea id="cg-paste-in" placeholder="Paste the JSON returned by ChatGPT here (markdown fences are stripped automatically)..."></textarea>
          <label class="checkbox-row">
            <input id="cg-auto-tts" type="checkbox" checked />
            <span>Automatically generate default <code>edge-tts</code> audio (.mp3) on Chapter Save</span>
          </label>
          <div class="row">
            <button id="save-chapter-btn" class="btn btn-primary" type="button">Save Chapter JSON + Sync TTS/Manifest</button>
            <button id="save-volume-btn" class="btn" type="button">Scaffold Volume</button>
            <button id="send-to-gemini-btn" class="btn btn-teal" type="button">Send to Stage 2 (Gemini)</button>
          </div>
          <div id="cg-save-log" class="log" style="margin-top:10px">Waiting for Chapter/Volume save...</div>
        </div>
      </div>
    </section>

    <!-- STAGE 2: FREE GEMINI -->
    <section id="tab-gemini" class="panel">
      <div class="grid">
        <div class="card">
          <h2>Stage 2A · Fact-Check, Sources &amp; YouTube Prompt (Free Gemini)</h2>
          <p class="small">Audits historical dates, mechanics, <code>whyItWasInvented</code>, <code>realWorldSighting</code>, and <code>sceneNotes</code>—plus curates verified primary source links and YouTube deep-dive videos before you generate SVGs.</p>
          <label>Chapter Draft / JSON to Audit</label>
          <textarea id="gm-draft-in" placeholder="Auto-filled from Stage 1 or loaded from the active chapter on disk..."></textarea>
          <div class="row">
            <button id="load-active-gm-btn" class="btn" type="button">Load Active Chapter from Disk</button>
            <button id="gen-gemini-btn" class="btn btn-primary" type="button">Generate Gemini Fact-Check Prompt</button>
            <button id="copy-gemini-btn" class="btn" type="button">Copy Prompt</button>
            <span id="gm-meta" class="small"></span>
          </div>
        </div>

        <div class="card">
          <h2>Stage 2B · Gemini Prompt &amp; Save Verified JSON</h2>
          <label>Generated Prompt (Paste into Free Gemini)</label>
          <textarea id="gm-prompt-out" readonly></textarea>
          <label>Paste Gemini's Verified Chapter JSON</label>
          <textarea id="gm-verified-in" placeholder="Paste Gemini's corrected chapter JSON here..."></textarea>
          <div class="row">
            <button id="save-verified-btn" class="btn btn-primary" type="button">Save Verified Chapter JSON (+ Auto edge-tts)</button>
            <button id="send-to-claude-btn" class="btn btn-teal" type="button">Load into Stage 3 (Claude SVGs)</button>
          </div>
          <div id="gm-save-log" class="log" style="margin-top:10px">Waiting for Gemini verified output...</div>
        </div>
      </div>
    </section>

    <!-- STAGE 3: FREE CLAUDE (STRICTLY SVG) -->
    <section id="tab-claude" class="panel">
      <div class="card">
        <div class="row-between">
          <div>
            <h2>Stage 3 · Strictly SVG Animations (Free Claude)</h2>
            <p class="small">Use <strong>Per-Scene Cards</strong> for separate fresh free Claude chats, or switch to the single <strong>Staged "NEXT"</strong> prompt below.</p>
          </div>
          <div class="row" style="margin-top:0">
            <label class="checkbox-row" style="margin:0">
              <input id="cl-compact" type="checkbox" />
              <span>Compact Mode (omit full exemplar SVG)</span>
            </label>
            <button id="gen-claude-btn" class="btn btn-primary" type="button">Build Claude SVG Prompts</button>
          </div>
        </div>
        <div id="cl-status" class="small" style="margin-top:8px"></div>
      </div>

      <div id="cl-scenes-list"></div>

      <div class="card">
        <div class="row-between">
          <h3>Optional: Single Staged "NEXT" Claude Thread Prompt</h3>
          <button id="copy-claude-staged-btn" class="btn" type="button">Copy Staged Prompt</button>
        </div>
        <textarea id="cl-staged-out" readonly placeholder="Click 'Build Claude SVG Prompts' to generate per-scene cards and this optional single-thread prompt..."></textarea>
      </div>
    </section>

    <!-- STAGE 4: AUDIO, VALIDATION & LIVE PREVIEW -->
    <section id="tab-audio" class="panel">
      <div class="grid">
        <div class="card">
          <h2>Default Narration: <code>edge-tts</code> (<code>en-US-AndrewMultilingualNeural</code>)</h2>
          <p class="small">Automatically generated on Chapter Save. Re-run anytime for the whole chapter or individual pages.</p>
          <div class="row">
            <button id="run-edge-tts-btn" class="btn btn-primary" type="button">Synthesize All Pages (edge-tts Default)</button>
            <button id="run-validate-btn" class="btn btn-teal" type="button">Run validate-cartridge.mjs</button>
            <a id="preview-link-panel" class="btn" href="/#networking/ch2/1" target="_blank" rel="noopener">Open Live Local Preview</a>
          </div>

          <h3 style="margin-top:18px">Optional Upgrade: Google AI Studio TTS (Higher Quality)</h3>
          <p class="small">Upgrade all pages or a single page via Gemini TTS REST API (key kept in session only, never written to disk) or import a <code>.wav</code>/<code>.mp3</code> downloaded from the free Google AI Studio Speech web UI.</p>
          <div class="grid">
            <div>
              <label>Gemini TTS Model</label>
              <input id="gai-model" value="gemini-2.5-flash-tts" />
            </div>
            <div>
              <label>Prebuilt Voice</label>
              <input id="gai-voice" value="Kore" placeholder="Kore, Charon, Puck, Aoede..." />
            </div>
          </div>
          <label>Session API Key (optional if GEMINI_API_KEY env var is set)</label>
          <input id="gai-key" type="password" placeholder="AIza... (never saved to disk)" />
          <label>Style / Pacing Cue (optional)</label>
          <input id="gai-style" placeholder="Read clearly like an engaging documentary narrator:" />
          <div class="row">
            <button id="run-gai-tts-btn" class="btn" type="button">Upgrade All Pages via Google AI Studio API</button>
          </div>
        </div>

        <div class="card">
          <h2>Per-Page Audio Status &amp; Free AI Studio Web Import</h2>
          <div id="audio-pages-list"></div>
          <label>CLI / Validation Output Console</label>
          <div id="runner-log" class="log">Ready.</div>
        </div>
      </div>
    </section>
  </main>

  <script>
    const state = { data: null, activeVol: "networking", activeChNum: 2, claudeData: null };

    async function api(path, body = null) {
      const opts = body === null
        ? { method: "GET" }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
      const res = await fetch(path, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    }

    function copyText(text, label) {
      if (!text) return;
      navigator.clipboard?.writeText(text).then(
        () => setPill(`${label} copied`, "ok"),
        () => setPill("Clipboard blocked — copy manually from box", "warn")
      );
    }

    function setPill(msg, kind = "") {
      const el = document.getElementById("top-status-pill");
      el.textContent = msg;
      el.className = `pill ${kind}`;
    }

    function activeChapterObj() {
      if (!state.data) return null;
      const vol = state.data.volumes.find(v => v.id === state.activeVol);
      return vol?.chapters.find(c => Number(c.number) === Number(state.activeChNum)) || null;
    }

    function updatePreviewLinks() {
      const ch = activeChapterObj();
      const chId = ch ? ch.id : `ch${state.activeChNum}`;
      const href = `/#${state.activeVol}/${chId}/1`;
      document.getElementById("preview-link").href = href;
      document.getElementById("preview-link-panel").href = href;
    }

    function renderAudioList() {
      const container = document.getElementById("audio-pages-list");
      const ch = activeChapterObj();
      if (!ch || !ch.pages?.length) {
        container.innerHTML = `<p class="small">Save Chapter JSON first to inspect per-page narration files.</p>`;
        return;
      }
      container.innerHTML = "";
      for (const p of ch.pages) {
        const div = document.createElement("div");
        div.className = "scene-card";
        const badge = p.audioExists
          ? `<span class="pill ok">MP3 Ready (${Math.round(p.audioBytes / 1024)} KB)</span>`
          : `<span class="pill warn">Missing MP3</span>`;
        const fname = `${ch.assetPrefix}-p${String(p.page).padStart(2, "0")}.mp3`;
        div.innerHTML = `
          <div class="row-between">
            <strong>Page ${p.page}: ${p.title}</strong>
            ${badge}
          </div>
          <div class="row">
            <button class="btn" type="button" data-copy-tts="${p.page}">Copy Narration Text</button>
            <button class="btn" type="button" data-edge-page="${p.page}">edge-tts Page ${p.page}</button>
            <button class="btn" type="button" data-gai-page="${p.page}">AI Studio Page ${p.page}</button>
            <label class="btn" style="margin:0">
              Import .wav/.mp3
              <input type="file" accept=".wav,.mp3,audio/*" hidden data-import-page="${p.page}" data-filename="${fname}" />
            </label>
          </div>
        `;
        div.querySelector(`[data-copy-tts]`).onclick = () => copyText(p.tts, `Page ${p.page} narration`);
        div.querySelector(`[data-edge-page]`).onclick = () => runTts("edge-tts", p.page);
        div.querySelector(`[data-gai-page]`).onclick = () => runTts("google-ai-studio", p.page);
        div.querySelector(`[data-import-page]`).onchange = (ev) => importAudioFile(ev.target, fname);
        container.appendChild(div);
      }
    }

    async function importAudioFile(inputEl, targetFilename) {
      const file = inputEl.files?.[0];
      if (!file) return;
      const ext = (file.name.split(".").pop() || "wav").toLowerCase();
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      try {
        setPill(`Importing ${targetFilename}...`, "warn");
        const res = await api("/api/save/audio", { filename: targetFilename, sourceExt: ext, audioBase64: b64 });
        document.getElementById("runner-log").textContent = `Saved ${res.audioPath} (${res.bytes} bytes)`;
        setPill(`Imported ${targetFilename}`, "ok");
        await refreshState();
      } catch (err) {
        document.getElementById("runner-log").textContent = `ERROR: ${err.message}`;
        setPill("Import failed", "err");
      }
    }

    async function refreshState(keepSelection = true) {
      state.data = await api("/api/state");
      const sel = document.getElementById("active-target");
      const prev = keepSelection ? `${state.activeVol}:${state.activeChNum}` : null;
      sel.innerHTML = "";
      for (const vol of state.data.volumes) {
        for (const ch of vol.chapters) {
          const opt = document.createElement("option");
          opt.value = `${vol.id}:${ch.number}`;
          opt.textContent = `${vol.title} · Ch ${ch.number}: ${ch.title}`;
          sel.appendChild(opt);
        }
        const nextOpt = document.createElement("option");
        nextOpt.value = `${vol.id}:${vol.nextChapterNumber}`;
        nextOpt.textContent = `${vol.title} · + Next (Ch ${vol.nextChapterNumber})`;
        sel.appendChild(nextOpt);
      }
      if (prev && Array.from(sel.options).some(o => o.value === prev)) {
        sel.value = prev;
      } else if (sel.options.length) {
        const ch2 = Array.from(sel.options).find(o => o.value === "networking:2");
        sel.value = ch2 ? ch2.value : sel.options[0].value;
      }
      const [v, c] = sel.value.split(":");
      state.activeVol = v;
      state.activeChNum = Number(c);
      syncFormFromSelection();
      updatePreviewLinks();
      renderAudioList();
      if (state.data.defaultCompact) {
        document.getElementById("cl-compact").checked = true;
      }
    }

    function syncFormFromSelection() {
      const vol = state.data?.volumes.find(v => v.id === state.activeVol);
      if (!vol) return;
      document.getElementById("cg-vol").value = vol.id;
      document.getElementById("cg-chnum").value = String(state.activeChNum);
      document.getElementById("cg-prefix").value = `${vol.code}-ch${state.activeChNum}`;
      const ch = activeChapterObj();
      if (ch?.chapterJson) {
        const raw = JSON.stringify(ch.chapterJson, null, 2);
        if (!document.getElementById("gm-draft-in").value.trim()) {
          document.getElementById("gm-draft-in").value = raw;
        }
      } else if (vol.nextRoadmap && Number(state.activeChNum) === Number(vol.nextChapterNumber)) {
        const rm = vol.nextRoadmap;
        if (rm.era) document.getElementById("cg-era").value = rm.era;
        if (rm.title) document.getElementById("cg-title").value = rm.title;
        if (rm.suggestedPages) document.getElementById("cg-pages").value = String(rm.suggestedPages);
        document.getElementById("cg-bottleneck").placeholder = `Loaded from ${rm.path} — leave blank to use roadmap brief automatically, or add extra notes...`;
        document.getElementById("cg-mechanisms").placeholder = `Loaded from ${rm.path} (${rm.suggestedPages} suggested pages)...`;
      }
    }

    document.getElementById("active-target").onchange = (ev) => {
      const [v, c] = ev.target.value.split(":");
      state.activeVol = v;
      state.activeChNum = Number(c);
      syncFormFromSelection();
      updatePreviewLinks();
      renderAudioList();
    };

    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
      };
    });

    document.getElementById("cg-target-type").onchange = (ev) => {
      const isVol = ev.target.value === "volume";
      document.getElementById("cg-chapter-fields").style.display = isVol ? "none" : "block";
      document.getElementById("cg-volume-fields").style.display = isVol ? "block" : "none";
    };

    document.getElementById("gen-chatgpt-btn").onclick = async () => {
      try {
        const targetType = document.getElementById("cg-target-type").value;
        const payload = targetType === "volume"
          ? {
              targetType,
              volumeId: document.getElementById("cg-new-vol").value,
              code: document.getElementById("cg-new-code").value,
              title: document.getElementById("cg-new-title").value,
              subtitle: document.getElementById("cg-new-sub").value,
              eraSpan: document.getElementById("cg-new-era").value,
              chapterCount: Number(document.getElementById("cg-new-count").value),
              progression: document.getElementById("cg-new-prog").value,
            }
          : {
              targetType,
              volumeId: document.getElementById("cg-vol").value,
              chapterNumber: Number(document.getElementById("cg-chnum").value),
              assetPrefix: document.getElementById("cg-prefix").value,
              pageCount: Number(document.getElementById("cg-pages").value),
              era: document.getElementById("cg-era").value,
              title: document.getElementById("cg-title").value,
              bottleneck: document.getElementById("cg-bottleneck").value,
              mechanisms: document.getElementById("cg-mechanisms").value,
              codexAnchors: document.getElementById("cg-codex").value,
              visualNotes: document.getElementById("cg-visual").value,
            };
        const res = await api("/api/prompts/chatgpt", payload);
        document.getElementById("cg-prompt-out").value = res.prompt;
        document.getElementById("cg-meta").textContent = `${res.chars} chars (~${res.approxTokens} tokens) · saved ${res.savedPath}`;
        setPill("ChatGPT prompt ready", "ok");
      } catch (err) {
        setPill(err.message, "err");
      }
    };

    document.getElementById("copy-chatgpt-btn").onclick = () => copyText(document.getElementById("cg-prompt-out").value, "ChatGPT prompt");

    document.getElementById("save-volume-btn").onclick = async () => {
      try {
        const res = await api("/api/save/volume", {
          volumeJson: document.getElementById("cg-paste-in").value,
          volumeId: document.getElementById("cg-new-vol").value,
          code: document.getElementById("cg-new-code").value,
          title: document.getElementById("cg-new-title").value,
        });
        document.getElementById("cg-save-log").textContent = `Scaffolded volume '${res.volumeId}' and updated ${res.manifestPath}`;
        setPill(`Volume ${res.volumeId} ready`, "ok");
        await refreshState();
      } catch (err) {
        document.getElementById("cg-save-log").textContent = `ERROR: ${err.message}`;
        setPill("Volume save failed", "err");
      }
    };

    async function handleSaveChapter(rawJsonText, logElId) {
      const logEl = document.getElementById(logElId);
      try {
        const autoTts = document.getElementById("cg-auto-tts").checked;
        setPill(autoTts ? "Saving Chapter & running edge-tts..." : "Saving Chapter...", "warn");
        logEl.textContent = "Saving chapter JSON, syncing TTS manifest, and updating manifest.json...";
        const res = await api("/api/save/chapter", { chapterJson: rawJsonText, autoTts });
        const ttsMsg = res.ttsResult
          ? `\nTTS (${res.ttsResult.provider}): ${res.ttsResult.ok ? "OK" : "FAILED"}\n${res.ttsResult.stdout || res.ttsResult.stderr}`
          : "";
        logEl.textContent = `Saved ${res.chapterPath}\nSynced ${res.ttsPath}\nUpdated ${res.manifestPath}${ttsMsg}`;
        setPill("Chapter saved", res.ttsResult && !res.ttsResult.ok ? "warn" : "ok");
        await refreshState(false);
      } catch (err) {
        logEl.textContent = `ERROR: ${err.message}`;
        setPill("Save failed", "err");
      }
    }

    document.getElementById("save-chapter-btn").onclick = () => handleSaveChapter(document.getElementById("cg-paste-in").value, "cg-save-log");
    document.getElementById("save-verified-btn").onclick = () => handleSaveChapter(document.getElementById("gm-verified-in").value, "gm-save-log");

    document.getElementById("send-to-gemini-btn").onclick = () => {
      document.getElementById("gm-draft-in").value = document.getElementById("cg-paste-in").value;
      document.querySelector('[data-tab="gemini"]').click();
    };

    document.getElementById("load-active-gm-btn").onclick = () => {
      const ch = activeChapterObj();
      if (ch?.chapterJson) {
        document.getElementById("gm-draft-in").value = JSON.stringify(ch.chapterJson, null, 2);
      }
    };

    document.getElementById("gen-gemini-btn").onclick = async () => {
      try {
        const res = await api("/api/prompts/gemini", {
          volumeId: state.activeVol,
          chapterNumber: state.activeChNum,
          draftText: document.getElementById("gm-draft-in").value,
        });
        document.getElementById("gm-prompt-out").value = res.prompt;
        document.getElementById("gm-meta").textContent = `${res.chars} chars (~${res.approxTokens} tokens)`;
        setPill("Gemini prompt ready", "ok");
      } catch (err) {
        setPill(err.message, "err");
      }
    };

    document.getElementById("copy-gemini-btn").onclick = () => copyText(document.getElementById("gm-prompt-out").value, "Gemini prompt");

    document.getElementById("send-to-claude-btn").onclick = () => {
      document.querySelector('[data-tab="claude"]').click();
      document.getElementById("gen-claude-btn").click();
    };

    document.getElementById("gen-claude-btn").onclick = async () => {
      try {
        const res = await api("/api/prompts/claude", {
          volumeId: state.activeVol,
          chapterNumber: state.activeChNum,
          compact: document.getElementById("cl-compact").checked,
          chapterText: document.getElementById("gm-verified-in").value.trim() || "",
        });
        state.claudeData = res;
        document.getElementById("cl-staged-out").value = res.stagedPrompt;
        document.getElementById("cl-status").textContent =
          `Generated ${res.scenes.length} standalone SVG prompts for ${res.volumeId} (${res.assetPrefix}) · ${res.compact ? "Compact" : "With Exemplar"}`;
        renderClaudeScenes(res);
        setPill("Claude SVG prompts ready", "ok");
      } catch (err) {
        document.getElementById("cl-status").textContent = `ERROR: ${err.message}`;
        setPill(err.message, "err");
      }
    };

    function renderClaudeScenes(data) {
      const container = document.getElementById("cl-scenes-list");
      container.innerHTML = "";
      const ch = activeChapterObj();
      for (const s of data.scenes) {
        const pageMeta = ch?.pages?.find(p => Number(p.page) === Number(s.page));
        const badge = pageMeta?.sceneExists
          ? `<span class="pill ok">Saved: ${s.targetPath}</span>`
          : `<span class="pill warn">Pending: ${s.targetPath}</span>`;
        const card = document.createElement("div");
        card.className = "scene-card";
        card.innerHTML = `
          <div class="row-between">
            <strong>Page ${s.page}: ${s.title} (<code>${s.sceneModule}.js</code>)</strong>
            ${badge}
          </div>
          <div class="row">
            <button class="btn btn-primary" type="button" data-copy-scene="${s.page}">Copy Claude Prompt (${s.approxTokens} tok)</button>
            <button class="btn" type="button" data-toggle-prompt="${s.page}">View Prompt</button>
          </div>
          <textarea data-prompt-box="${s.page}" readonly style="display:none;margin-top:8px"></textarea>
          <label>Paste Claude's <code>${s.sceneModule}.js</code> Output</label>
          <textarea data-code-box="${s.page}" placeholder="Paste the complete ES6 module returned by Claude here..."></textarea>
          <div class="row">
            <button class="btn btn-teal" type="button" data-save-scene="${s.page}">Save ${s.sceneModule}.js</button>
            <span class="small" data-scene-msg="${s.page}"></span>
          </div>
        `;
        const promptBox = card.querySelector(`[data-prompt-box="${s.page}"]`);
        promptBox.value = s.prompt;
        card.querySelector(`[data-copy-scene="${s.page}"]`).onclick = () => copyText(s.prompt, s.sceneModule);
        card.querySelector(`[data-toggle-prompt="${s.page}"]`).onclick = () => {
          promptBox.style.display = promptBox.style.display === "none" ? "block" : "none";
        };
        card.querySelector(`[data-save-scene="${s.page}"]`).onclick = async () => {
          const msgEl = card.querySelector(`[data-scene-msg="${s.page}"]`);
          try {
            const code = card.querySelector(`[data-code-box="${s.page}"]`).value;
            const saved = await api("/api/save/scene", {
              volumeId: data.volumeId,
              sceneModule: s.sceneModule,
              sceneCode: code,
            });
            msgEl.textContent = `Saved ${saved.scenePath}`;
            setPill(`Saved ${s.sceneModule}.js`, "ok");
            await refreshState();
          } catch (err) {
            msgEl.textContent = `ERROR: ${err.message}`;
            setPill("Scene save failed", "err");
          }
        };
        container.appendChild(card);
      }
    }

    document.getElementById("copy-claude-staged-btn").onclick = () => copyText(document.getElementById("cl-staged-out").value, "Staged Claude prompt");

    async function runTts(provider, page = null) {
      const log = document.getElementById("runner-log");
      try {
        setPill(`Running ${provider}...`, "warn");
        log.textContent = `Running ${provider}${page ? ` (Page ${page})` : ""}...`;
        const res = await api("/api/run/tts", {
          provider,
          volumeId: state.activeVol,
          chapterNumber: state.activeChNum,
          page,
          apiKey: document.getElementById("gai-key").value,
          model: document.getElementById("gai-model").value,
          voiceName: document.getElementById("gai-voice").value,
          stylePrompt: document.getElementById("gai-style").value,
        });
        log.textContent = [res.stdout, res.stderr].filter(Boolean).join("\n") || "Done.";
        setPill(res.ok ? `${provider} complete` : `${provider} failed`, res.ok ? "ok" : "err");
        await refreshState();
      } catch (err) {
        log.textContent = `ERROR: ${err.message}`;
        setPill("TTS failed", "err");
      }
    }

    document.getElementById("run-edge-tts-btn").onclick = () => runTts("edge-tts");
    document.getElementById("run-gai-tts-btn").onclick = () => runTts("google-ai-studio");

    async function runValidation() {
      const log = document.getElementById("runner-log");
      try {
        setPill("Validating...", "warn");
        const res = await api("/api/run/validate", {});
        log.textContent = [res.stdout, res.stderr].filter(Boolean).join("\n") || "Validation finished.";
        setPill(res.ok ? "Validator OK" : "Validator Errors", res.ok ? "ok" : "err");
      } catch (err) {
        log.textContent = `ERROR: ${err.message}`;
        setPill("Validator failed", "err");
      }
    }

    document.getElementById("run-validate-btn").onclick = runValidation;
    document.getElementById("top-validate-btn").onclick = runValidation;

    refreshState(false).catch(err => setPill(err.message, "err"));
  </script>
</body>
</html>
"""


class StudioHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, server_address, RequestHandlerClass, studio_app: StudioApp):
        self.studio_app = studio_app
        super().__init__(server_address, RequestHandlerClass)


def make_handler(repo_root: Path):
    class StudioRequestHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(repo_root), **kwargs)

        def end_headers(self) -> None:
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            super().end_headers()

        def log_message(self, format: str, *args) -> None:
            # Keep terminal output quiet unless debugging
            return

        def _send_json(self, status: int, payload: dict) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path in ("/studio", "/studio/"):
                body = STUDIO_HTML.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if parsed.path == "/api/state":
                try:
                    self._send_json(200, self.server.studio_app.get_state())
                except Exception as exc:
                    self._send_json(400, {"error": str(exc)})
                return
            super().do_GET()

        def do_POST(self) -> None:
            parsed = urllib.parse.urlparse(self.path)
            try:
                length = int(self.headers.get("Content-Length", "0"))
                raw = self.rfile.read(length) if length > 0 else b"{}"
                payload = json.loads(raw.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise StudioError("JSON body must be an object.")
            except StudioError as exc:
                self._send_json(400, {"error": str(exc)})
                return
            except Exception as exc:
                self._send_json(400, {"error": f"Invalid JSON request body: {exc}"})
                return

            app: StudioApp = self.server.studio_app
            routes = {
                "/api/prompts/chatgpt": app.build_chatgpt_prompt,
                "/api/prompts/gemini": app.build_gemini_prompt,
                "/api/prompts/claude": app.build_claude_prompts,
                "/api/save/volume": app.save_volume,
                "/api/save/chapter": app.save_chapter,
                "/api/save/scene": app.save_scene,
                "/api/save/audio": app.save_audio,
                "/api/run/tts": app.run_tts,
                "/api/run/validate": app.run_validate,
            }
            handler = routes.get(parsed.path)
            if not handler:
                self._send_json(404, {"error": f"Unknown endpoint: {parsed.path}"})
                return
            try:
                result = handler(payload)
                self._send_json(200, result)
            except StudioError as exc:
                self._send_json(400, {"error": str(exc)})
            except Exception as exc:
                self._send_json(500, {"error": f"Server error: {exc}"})

    return StudioRequestHandler


def create_studio_server(
    repo_root: Path,
    port: int = 8765,
    default_compact: bool = False,
    exemplar_rel: str = DEFAULT_EXEMPLAR,
) -> StudioHTTPServer:
    """Create a loopback-only no-cache StudioHTTPServer, falling back to a free port if busy."""
    app = StudioApp(repo_root=repo_root, default_compact=default_compact, exemplar_rel=exemplar_rel)
    handler_cls = make_handler(Path(repo_root).resolve())
    try:
        return StudioHTTPServer(("127.0.0.1", port), handler_cls, app)
    except OSError:
        if port == 0:
            raise
        return StudioHTTPServer(("127.0.0.1", 0), handler_cls, app)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Launch the StackRewind Localhost Multi-Model Authoring Studio & Live Preview Server."
    )
    parser.add_argument("--port", type=int, default=8765, help="Preferred localhost port (default: 8765)")
    parser.add_argument("--no-open", action="store_true", help="Do not automatically open the browser")
    parser.add_argument("--compact", action="store_true", help="Default Claude SVG prompts to compact mode")
    parser.add_argument(
        "--exemplar",
        default=DEFAULT_EXEMPLAR,
        help=f"Relative path to SVG exemplar scene (default: {DEFAULT_EXEMPLAR})",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = Path(__file__).resolve().parent.parent
    server = create_studio_server(
        repo_root=repo_root,
        port=args.port,
        default_compact=args.compact,
        exemplar_rel=args.exemplar,
    )
    actual_port = server.server_address[1]
    studio_url = f"http://127.0.0.1:{actual_port}/studio"
    preview_url = f"http://127.0.0.1:{actual_port}/"
    print(f"[StackRewind Studio] GUI:     {studio_url}")
    print(f"[StackRewind Studio] Preview: {preview_url}")
    print("[StackRewind Studio] Press Ctrl+C to stop.")

    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(studio_url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[StackRewind Studio] Shutting down.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
