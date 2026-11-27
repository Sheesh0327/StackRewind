import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_VOICE = "en-US-AndrewMultilingualNeural";

function parseArgs(argv) {
  const opts = { chapterPaths: [], page: null, dryRun: false, overwrite: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--chapter" && argv[i + 1]) opts.chapterPaths.push(argv[++i]);
    else if (arg === "--page" && argv[i + 1]) opts.page = Number.parseInt(argv[++i], 10);
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--overwrite") opts.overwrite = true;
  }
  return opts;
}

function resolveChapterPaths(requested) {
  if (requested.length > 0) return requested;
  const manifest = JSON.parse(fs.readFileSync("content/manifest.json", "utf8"));
  const paths = [];
  for (const vol of manifest.volumes || []) {
    if (vol.status !== "published") continue;
    for (const ch of vol.chapters || []) {
      if (ch.dataPath) paths.push(ch.dataPath);
    }
  }
  return paths;
}

function findRunner() {
  const candidates = [
    { cmd: "edge-tts", baseArgs: [] },
    { cmd: "python", baseArgs: ["-m", "edge_tts"] },
    { cmd: "py", baseArgs: ["-m", "edge_tts"] },
    { cmd: "python3", baseArgs: ["-m", "edge_tts"] },
  ];
  for (const c of candidates) {
    const probe = spawnSync(c.cmd, [...c.baseArgs, "--help"], { encoding: "utf8" });
    if (probe.status === 0) return c;
  }
  return null;
}

function loadJobs(chapterPath, pageFilter) {
  const chapter = JSON.parse(fs.readFileSync(chapterPath, "utf8"));
  const ttsPath = path.join("content", chapter.volumeId, "tts", `${chapter.assetPrefix}-tts.json`);
  const ttsData = fs.existsSync(ttsPath) ? JSON.parse(fs.readFileSync(ttsPath, "utf8")) : null;

  const voice = ttsData?.voice || DEFAULT_VOICE;
  const rate = ttsData?.rate || null;
  const pitch = ttsData?.pitch || null;

  const sourcePages = ttsData?.pages || chapter.pages || [];
  return sourcePages
    .filter((entry) => pageFilter === null || entry.page === pageFilter)
    .map((entry) => {
      const pad = String(entry.page).padStart(2, "0");
      const output = entry.output || `assets/audio/${chapter.assetPrefix}-p${pad}.mp3`;
      const rawText = entry.text ?? entry.tts ?? "";
      const text = rawText.replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, "$1").trim();
      return { page: entry.page, voice, rate, pitch, text, output };
    });
}

function formatShellCommand(job) {
  const escaped = job.text.replace(/"/g, '\\"');
  const parts = ["python -m edge_tts", `--voice ${job.voice}`];
  if (job.rate) parts.push(`--rate="${job.rate}"`);
  if (job.pitch) parts.push(`--pitch="${job.pitch}"`);
  parts.push(`--text "${escaped}"`, `--write-media ${job.output}`);
  return parts.join(" ");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const chapterPaths = resolveChapterPaths(opts.chapterPaths);
  const runner = opts.dryRun ? null : findRunner();

  if (!opts.dryRun && !runner) {
    console.warn("[generate-tts] edge_tts CLI not found on PATH; printing runnable commands instead:");
  }

  for (const chPath of chapterPaths) {
    const jobs = loadJobs(chPath, opts.page);
    for (const job of jobs) {
      if (!job.text) {
        console.error(`[generate-tts] Empty TTS text for ${chPath} page ${job.page}`);
        process.exit(1);
      }

      if (opts.dryRun || !runner) {
        console.log(formatShellCommand(job));
        continue;
      }

      if (!opts.overwrite && fs.existsSync(job.output) && fs.statSync(job.output).size > 0) {
        console.log(`[generate-tts] Skipping existing ${job.output} (use --overwrite to regenerate)`);
        continue;
      }

      fs.mkdirSync(path.dirname(job.output), { recursive: true });
      const args = [...runner.baseArgs, "--voice", job.voice];
      if (job.rate) args.push(`--rate=${job.rate}`);
      if (job.pitch) args.push(`--pitch=${job.pitch}`);
      args.push("--text", job.text, "--write-media", job.output);

      const res = spawnSync(runner.cmd, args, { encoding: "utf8" });
      if (res.status !== 0 || !fs.existsSync(job.output) || fs.statSync(job.output).size === 0) {
        console.error(`[generate-tts] Failed ${job.output}:`, res.stderr || res.error || "empty output");
        process.exit(1);
      }
      console.log(`[generate-tts] Wrote ${job.output} (${fs.statSync(job.output).size} bytes)`);
    }
  }
}

main();
