import { normalizeGeotypeSlug } from './normalize.js';

/** Default geotype when brand and feature properties omit geotype. */
export const VENUE_GEOTYPE_FALLBACK = 'specialty_store';

/**
 * Example retail brand → geotype slug (`data/features.yml` `name`).
 * Store format (`kind`) is separate — not encoded here.
 */
export const BRAND_GEOTYPE_DEFAULTS: Readonly<Record<string, string>> = {
  retail: 'electronics_store',
  att: 'electronics_store',
  verizon: 'electronics_store',
  tmobile: 'electronics_store',
  cox: 'electronics_store',
  metro: 'electronics_store',
  ikea: 'furniture_store',
};

export function geotypeForBrand(brand: string): string {
  const slug = brand.trim().toLowerCase();
  return normalizeGeotypeSlug(
    BRAND_GEOTYPE_DEFAULTS[slug] ?? VENUE_GEOTYPE_FALLBACK
  );
}
