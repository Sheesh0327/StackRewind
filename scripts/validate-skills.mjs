import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  let skillsDir = path.join(repoRoot, ".agents", "skills");
  let agentsFile = path.join(repoRoot, "AGENTS.md");

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--skills-dir" && argv[i + 1]) {
      skillsDir = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg === "--agents-file" && argv[i + 1]) {
      agentsFile = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { skillsDir, agentsFile };
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return null;
  }

  const rawYaml = match[1];
  const body = match[2];
  const fields = {};

  for (const line of rawYaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const kv = trimmed.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) {
      return { error: `Unsupported frontmatter line: "${trimmed}"`, fields, body };
    }
    let value = kv[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[kv[1]] = value;
  }

  return { fields, body };
}

function main() {
  const { skillsDir, agentsFile } = parseArgs(process.argv.slice(2));
  const errors = [];

  if (!fs.existsSync(skillsDir) || !fs.statSync(skillsDir).isDirectory()) {
    errors.push(`Skills directory not found: ${skillsDir}`);
  }

  let agentsContent = "";
  if (!fs.existsSync(agentsFile)) {
    errors.push(`AGENTS.md not found: ${agentsFile}`);
  } else {
    agentsContent = fs.readFileSync(agentsFile, "utf8");
  }

  let skillDirs = [];
  if (errors.length === 0) {
    skillDirs = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    if (skillDirs.length === 0) {
      errors.push(`No skill subdirectories found in ${skillsDir}`);
    }
  }

  for (const folder of skillDirs) {
    const skillFile = path.join(skillsDir, folder, "SKILL.md");
    if (!fs.existsSync(skillFile)) {
      errors.push(`[${folder}] Missing required SKILL.md at ${skillFile}`);
      continue;
    }

    const raw = fs.readFileSync(skillFile, "utf8");
    const parsed = parseFrontmatter(raw);
    if (!parsed) {
      errors.push(`[${folder}] SKILL.md must start with valid --- YAML frontmatter.`);
      continue;
    }
    if (parsed.error) {
      errors.push(`[${folder}] ${parsed.error}`);
    }

    const { fields, body } = parsed;
    if (!fields.name) {
      errors.push(`[${folder}] Frontmatter missing required "name" field.`);
    } else if (fields.name !== folder) {
      errors.push(
        `[${folder}] Frontmatter name "${fields.name}" does not match folder name "${folder}".`
      );
    }

    if (!fields.description || fields.description.trim().length < 10) {
      errors.push(`[${folder}] Frontmatter missing non-empty "description" field.`);
    }

    if (!body || body.trim().length === 0) {
      errors.push(`[${folder}] SKILL.md body is empty.`);
    }

    if (agentsContent && !agentsContent.includes(folder)) {
      errors.push(`[${folder}] Skill is not indexed in ${path.basename(agentsFile)}.`);
    }

    if (folder === "author-chapter" || folder === "author-volume") {
      const hasInterview = /\b(interview|questions)\b/i.test(body);
      const hasReviewGate =
        /\b(review gate|approval gate)\b/i.test(body) &&
        /\b(explicit user approval|explicit approval|until.*approv|confirm approval)\b/i.test(body);

      if (!hasInterview) {
        errors.push(`[${folder}] Interactive discovery interview instructions are missing.`);
      }
      if (!hasReviewGate) {
        errors.push(`[${folder}] Pre-code approval/review gate instructions are missing.`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("[Skills Validator] FAILED:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`[Skills Validator] OK (${skillDirs.length} skill(s) validated).`);
}

main();
