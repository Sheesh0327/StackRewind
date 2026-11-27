const TOKEN_RE = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

export function extractTermIds(dialogueText) {
  if (typeof dialogueText !== "string") return [];
  const ids = [];
  for (const match of dialogueText.matchAll(TOKEN_RE)) {
    ids.push(match[2].trim());
  }
  return ids;
}

export function parseDialogueToFragment(dialogueText, codexMap, onTermClick) {
  const fragment = document.createDocumentFragment();
  if (typeof dialogueText !== "string" || !dialogueText) {
    return fragment;
  }

  let lastIndex = 0;
  for (const match of dialogueText.matchAll(TOKEN_RE)) {
    const [fullMatch, displayTerm, rawTermId] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      fragment.appendChild(document.createTextNode(dialogueText.slice(lastIndex, matchIndex)));
    }

    const termId = rawTermId.trim();
    const hasEntry = Boolean(codexMap && Object.hasOwn(codexMap, termId));

    if (hasEntry) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "codex-term";
      btn.dataset.termId = termId;
      btn.textContent = displayTerm;
      btn.addEventListener("click", () => onTermClick?.(termId));
      fragment.appendChild(btn);
    } else {
      fragment.appendChild(document.createTextNode(displayTerm));
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < dialogueText.length) {
    fragment.appendChild(document.createTextNode(dialogueText.slice(lastIndex)));
  }

  return fragment;
}
