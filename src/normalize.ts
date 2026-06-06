import { isKnownGeotypeSlug } from './slugs.js';

/** Normalize free text to geotypes `name` slug form. */
export function normalizeGeotypeSlug(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function resolveGeotypeSlug(value: string, fallback: string): string {
  const slug = normalizeGeotypeSlug(value);
  if (!slug) return fallback;
  return isKnownGeotypeSlug(slug) ? slug : fallback;
}
