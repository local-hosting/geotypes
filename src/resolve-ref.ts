import { acronymToSlug } from './generated/acronyms.js';
import { isKnownGeotypeSlug } from './slugs.js';
import { normalizeGeotypeSlug } from './normalize.js';
import { slugToAcronym } from './generated/acronyms.js';

export type GeotypeRef = string;

export type ResolvedGeotype = {
  acronym: string;
  slug: string;
};

/** Accept acronym (RSE) or slug (electronics_store) → canonical pair. */
export function resolveGeotypeRef(ref: GeotypeRef): ResolvedGeotype | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  const fromAcronym = acronymToSlug(trimmed);
  if (fromAcronym) {
    return { acronym: trimmed.toUpperCase(), slug: fromAcronym };
  }

  const slug = normalizeGeotypeSlug(trimmed);
  if (!slug || !isKnownGeotypeSlug(slug)) return null;
  const acronym = slugToAcronym(slug);
  if (!acronym) return null;
  return { acronym, slug };
}
