import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TOKEN_RE = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
const YOUTUBE_URL_RE = /^https:\/\/(www\.|m\.)?(youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}(?:&.*)?|youtu\.be\/[A-Za-z0-9_-]{11}(?:\?.*)?)$/;
const REQUIRED_EXPORTS = ["mount", "unmount", "pause", "resume", "replay"];
const PAGE_MIN_WORDS = 30;
const PAGE_MAX_WORDS = 130;
const CODEX_MIN_WORDS = 10;

function countWords(text) {
  if (typeof text !== "string") return 0;
  const plain = text.replace(TOKEN_RE, "$1").trim();
  return plain ? plain.split(/\s+/).length : 0;
}

function parseArgs(argv) {
  const opts = { chapterPaths: [], allowMissingAudio: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--chapter" && argv[i + 1]) opts.chapterPaths.push(argv[++i]);
    else if (arg === "--allow-missing-audio") opts.allowMissingAudio = true;
  }
  return opts;
}

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    errors.push(`Invalid JSON in ${filePath}: ${err.message}`);
    return null;
  }
}

async function validateChapter(chPath, opts, errors, warnings) {
  const ch = readJson(chPath, errors);
  if (!ch) return;

  for (const field of ["volumeId", "chapterId", "chapterNumber", "assetPrefix", "era", "title", "subtitle", "pages", "codex"]) {
    if (ch[field] === undefined || ch[field] === null || ch[field] === "") {
      errors.push(`${chPath}: missing chapter field "${field}"`);
    }
  }

  if (!Array.isArray(ch.pages) || ch.pages.length === 0) {
    errors.push(`${chPath}: "pages" must be a non-empty array`);
    return;
  }

  const codex = ch.codex || {};
  for (const [termId, entry] of Object.entries(codex)) {
    for (const k of ["term", "plainEnglish", "whyItWasInvented", "realWorldSighting"]) {
      if (typeof entry?.[k] !== "string" || !entry[k].trim()) {
        errors.push(`${chPath}: codex["${termId}"] missing non-empty "${k}"`);
      } else if (k !== "term") {
        const words = countWords(entry[k]);
        if (words < CODEX_MIN_WORDS) {
          errors.push(`${chPath}: codex["${termId}"].${k} has ${words} words (minimum ${CODEX_MIN_WORDS})`);
        }
      }
    }
  }

  const ttsPath = path.join("content", String(ch.volumeId), "tts", `${ch.assetPrefix}-tts.json`);
  let ttsManifest = null;
  if (!fs.existsSync(ttsPath)) {
    errors.push(`${chPath}: missing standalone TTS manifest ${ttsPath}`);
  } else {
    ttsManifest = readJson(ttsPath, errors);
    if (ttsManifest) {
      if (ttsManifest.voice !== "en-US-AndrewMultilingualNeural") {
        errors.push(`${ttsPath}: voice must be "en-US-AndrewMultilingualNeural"`);
      }
      if (!Array.isArray(ttsManifest.pages) || ttsManifest.pages.length !== ch.pages.length) {
        errors.push(`${ttsPath}: pages length must match ${chPath} (${ch.pages.length})`);
      }
    }
  }

  for (let i = 0; i < ch.pages.length; i++) {
    const p = ch.pages[i];
    const pad = String(p.page).padStart(2, "0");

    for (const field of ["page", "panelType", "title", "speaker", "dialogue", "tts", "sceneNotes"]) {
      if (p[field] === undefined || p[field] === null || p[field] === "") {
        errors.push(`${chPath} page ${p.page ?? i + 1}: missing "${field}"`);
      }
    }

    if (!p.deepDive || typeof p.deepDive !== "object") {
      errors.push(`${chPath} page ${p.page ?? i + 1}: missing "deepDive" YouTube object`);
    } else {
      for (const dk of ["title", "channel", "url", "focus"]) {
        if (typeof p.deepDive[dk] !== "string" || !p.deepDive[dk].trim()) {
          errors.push(`${chPath} page ${p.page}: deepDive missing non-empty "${dk}"`);
        }
      }
      if (typeof p.deepDive.url === "string" && !YOUTUBE_URL_RE.test(p.deepDive.url.trim())) {
        errors.push(`${chPath} page ${p.page}: deepDive.url must be a valid https://youtube.com/watch?v=... or https://youtu.be/... URL`);
      }
    }

    if (typeof p.tts === "string" && (p.tts.includes("[[") || p.tts.includes("]]"))) {
      errors.push(`${chPath} page ${p.page}: "tts" must not contain [[ or ]] codex brackets`);
    }

    const dialogueWords = countWords(p.dialogue);
    if (dialogueWords < PAGE_MIN_WORDS || dialogueWords > PAGE_MAX_WORDS) {
      errors.push(`${chPath} page ${p.page}: dialogue has ${dialogueWords} words (must be ${PAGE_MIN_WORDS}–${PAGE_MAX_WORDS})`);
    }
    const ttsWords = countWords(p.tts);
    if (ttsWords < PAGE_MIN_WORDS || ttsWords > PAGE_MAX_WORDS) {
      errors.push(`${chPath} page ${p.page}: tts has ${ttsWords} words (must be ${PAGE_MIN_WORDS}–${PAGE_MAX_WORDS})`);
    }

    if (typeof p.dialogue === "string") {
      for (const match of p.dialogue.matchAll(TOKEN_RE)) {
        const termId = match[2].trim();
        if (!Object.hasOwn(codex, termId)) {
          errors.push(`${chPath} page ${p.page}: unresolved codex token "${termId}"`);
        }
      }
    }

    const expectedAudio = `assets/audio/${ch.assetPrefix}-p${pad}.mp3`;
    if (ttsManifest?.pages?.[i]) {
      const tp = ttsManifest.pages[i];
      if (tp.page !== p.page) errors.push(`${ttsPath}: entry ${i} page mismatch (${tp.page} vs ${p.page})`);
      if (tp.output !== expectedAudio) errors.push(`${ttsPath}: page ${p.page} output must be "${expectedAudio}"`);
      if (tp.text !== p.tts) errors.push(`${ttsPath}: page ${p.page} text does not match chapter page.tts`);
      if (typeof tp.text === "string" && (tp.text.includes("[[") || tp.text.includes("]]"))) {
        errors.push(`${ttsPath}: page ${p.page} text contains [[ or ]] brackets`);
      }
    }

    if (p.panelType === "svg-scene") {
      if (!p.sceneModule) {
        errors.push(`${chPath} page ${p.page}: svg-scene missing "sceneModule"`);
      } else {
        const scenePath = path.join("content", String(ch.volumeId), "scenes", `${p.sceneModule}.js`);
        if (!fs.existsSync(scenePath)) {
          errors.push(`${chPath} page ${p.page}: missing scene module ${scenePath}`);
        } else {
          const src = fs.readFileSync(scenePath, "utf8");
          if (!src.includes("data-scene") && !src.includes("createLoopingScene")) {
            errors.push(`${scenePath}: must scope CSS with [data-scene] or use createLoopingScene()`);
          }
          if (!src.includes("--sr-")) {
            errors.push(`${scenePath}: must consume --sr-* theme tokens`);
          }
          try {
            const mod = await import(pathToFileURL(path.resolve(scenePath)).href);
            for (const fn of REQUIRED_EXPORTS) {
              if (typeof mod[fn] !== "function") {
                errors.push(`${scenePath}: missing required function export "${fn}()"`);
              }
            }
          } catch (err) {
            errors.push(`${scenePath}: failed to import (${err.message})`);
          }
        }
      }
    }

    if (!fs.existsSync(expectedAudio) || fs.statSync(expectedAudio).size === 0) {
      const msg = `${chPath} page ${p.page}: missing or empty audio file ${expectedAudio}`;
      if (opts.allowMissingAudio) warnings.push(msg);
      else errors.push(msg);
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const errors = [];
  const warnings = [];
  let chapterPaths = opts.chapterPaths;

  if (chapterPaths.length === 0) {
    if (fs.existsSync("data")) errors.push("Legacy split directory data/ must not exist");
    if (fs.existsSync("js/scenes")) errors.push("Legacy duplicate directory js/scenes/ must not exist");

    const manifest = readJson("content/manifest.json", errors);
    if (manifest) {
      for (const vol of manifest.volumes || []) {
        if (vol.status !== "published") continue;
        for (const ch of vol.chapters || []) {
          if (!ch.dataPath || !ch.dataPath.startsWith("content/")) {
            errors.push(`content/manifest.json: chapter "${ch.id}" dataPath must start with "content/"`);
          } else {
            chapterPaths.push(ch.dataPath);
          }
        }
      }
    }
  }

  for (const chPath of chapterPaths) {
    await validateChapter(chPath, opts, errors, warnings);
  }

  for (const w of warnings) console.warn(`[Cartridge Validator WARN] ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`[Cartridge Validator ERROR] ${e}`);
    process.exit(1);
  }

  console.log(`[Cartridge Validator] OK (${chapterPaths.length} chapter(s) validated).`);
}

main();
