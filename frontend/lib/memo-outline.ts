export interface MemoOutlineEntry {
  id: string;
  label: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    // Strip leading numeric prefixes like "1.", "1.2", "1.2.3" that appear in
    // outline-style memo headings so slugs read as words, not "1-company-overview".
    .replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extract top-level H2 headings from a memo markdown document. The leading H1
 * (document title) is intentionally skipped because it is already rendered
 * elsewhere in the page chrome.
 *
 * Note: only ATX-style headings (`## Heading`) are recognised. Setext-style
 * headings (`Heading\n---`) are not supported because none of the checked-in
 * memos use them; add support here if that changes.
 */
export function extractMemoOutline(markdown: string): MemoOutlineEntry[] {
  const seen = new Set<string>();
  const entries: MemoOutlineEntry[] = [];

  // Split on newlines and match heading lines. We look only at H2 so the
  // outline stays short and scannable even on long memos.
  const lines = markdown.split('\n');
  let inFence = false;

  for (const line of lines) {
    const fenceMatch = line.match(/^```/);
    if (fenceMatch) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const label = match[1].trim();
    if (!label) continue;

    const id = slugifyHeading(label);
    if (!id || seen.has(id)) continue;

    seen.add(id);
    entries.push({ id, label });
  }

  return entries;
}
