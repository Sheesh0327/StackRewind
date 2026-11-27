---
name: fact-check-chapter
description: Audit a pre-code StackRewind chapter draft or existing chapter JSON and SVG scenes across historical dates, engineering mechanisms, causal whyItWasInvented claims, modern realWorldSighting references, and SVG-to-dialogue consistency using VERIFIED / IMPRECISE / INCORRECT verdicts before patching files.
---

# Fact-Check StackRewind Chapter

Verify historical, mechanical, and visual accuracy without adding unnecessary textbook bloat. Supports both **pre-code script drafts** (during `author-chapter` Phase 2) and **existing chapter bundles** (`content/<volume>/chapter<N>.json` + `content/<volume>/scenes/*.js`). Never edit Read-Only Console files (`index.html`, `css/`, `js/`).

## Audit Scope (5 Mandatory Dimensions)

Inspect every page (`dialogue`, `tts`, `sceneNotes`), every `codex` entry (`term`, `shortTag`, `plainEnglish`, `whyItWasInvented`, `realWorldSighting`), and every referenced SVG scene module (`content/<volume>/scenes/<sceneModule>.js`):

1. **Historical Accuracy**: Verify years, chronological order, named pioneers, research labs, standards bodies, and RFC/specification numbers.
2. **Step-by-Step Technical Mechanics**: Verify bits, header fields, frame boundaries, relays, queues, state machines, timers, and lookup algorithms in `dialogue`, `tts`, and `codex.plainEnglish`. Flag oversimplifications that invert causality or state false behavior.
3. **Causal Accuracy (`whyItWasInvented`)**: Confirm the cited bottleneck, cost, or failure mode genuinely motivated the design rather than repeating a retrospective myth.
4. **Modern Accuracy (`realWorldSighting`)**: Verify that cited modern protocols, Wireshark/CLI inspections, OS behaviors, or header fields still work as described today.
5. **SVG-to-Dialogue Fidelity**: Verify that diagram labels, bit sequences, node counts, packet routes, timing ratios, and failure states in `sceneNotes` and `scenes/*.js` match the prose and engineering reality.
6. **Per-Page YouTube Deep-Dive Verification**: Verify every page's `deepDive` (`title`, `channel`, `url`, `focus`) resolves to a real, live YouTube video (via web search + YouTube oEmbed/link resolution), matches the cited creator/title, and deeply explains that specific page's mechanism. Flag any dead, off-topic, or guessed video ID as `INCORRECT`.

## Verification Protocol

- Whenever `content/<volume>/ROADMAP.md` exists, cross-check the draft against its primary evidence links, `## Editorial checks`, and `## Published chapter maintenance` notes.
- Whenever any date, protocol detail, bit layout, or historical attribution is uncertain, **verify against authoritative sources** (primary RFCs, standards docs, hardware manuals, or reliable reference lookups) rather than relying on memory or guessing.
- Preserve StackRewind's **Problem → Concrete Mechanism → Result/Trade-Off** density (`60–95` target words per page): proposed fixes MUST correct inaccuracies concisely without bloating pages with unrelated trivia.

## Required Audit Output Format

Present findings in a structured Markdown table **before modifying any files**:

| Claim | Location (Page / Codex / SVG) | Verdict | Evidence / Proposed Fix |
| :--- | :--- | :--- | :--- |
| Example claim summary | Page 2 `dialogue` / `codex.circuit-switching` | `VERIFIED` / `IMPRECISE` / `INCORRECT` | Short verification note or exact minimal wording fix |

Include a summary line with total counts:
- `Summary: <N> VERIFIED, <M> IMPRECISE, <K> INCORRECT`

Use strictly these three verdict tags:
- `VERIFIED`: Accurate in chronology, engineering mechanics, and diagram representation.
- `IMPRECISE`: Technically directionally true, but ambiguous wording or an oversimplified diagram label risks teaching the wrong mechanism.
- `INCORRECT`: Factually wrong date, attribution, mechanical behavior, modern sighting, or contradictory SVG depiction.

## Approval Gate & File Sync

- **Wait for explicit user confirmation before patching files**, unless the user explicitly asked for automatic fixes upfront.
- When applying approved fixes to an existing chapter JSON:
  1. Update both `page.dialogue` (preserving `[[Display Term|term-id]]` tokens) and `page.tts` (zero `[[`/`]]` brackets) so they stay synchronized.
  2. Update `content/<volume>/tts/<assetPrefix>-tts.json` with matching `text`.
  3. Regenerate affected `.mp3` files via `node scripts/generate-tts.mjs --chapter content/<volume>/chapter<N>.json --overwrite` whenever spoken `tts` text changed.
  4. Update any mismatched SVG scene labels/animations (`content/<volume>/scenes/*.js`).
  5. Run `node scripts/validate-cartridge.mjs` and confirm exit `0`.
