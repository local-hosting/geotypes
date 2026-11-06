/**
 * Split a place title across two lines for larger on-cube type (isocanvas respects `\n`).
 * Only splits on spaces (two or more words); single tokens stay one line.
 */
export function vizTaxonomyPlaceLabelTwoLines(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return '';
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return trimmed;
  }
  const mid = Math.ceil(words.length / 2);
  return `${words.slice(0, mid).join(' ')}\n${words.slice(mid).join(' ')}`;
}
