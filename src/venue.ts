import { geotypeForBrand } from './brand-crosswalk.js';
import { normalizeGeotypeSlug } from './normalize.js';

export type VenueGeotypeFeature = {
  type?: string;
  properties?: Record<string, unknown>;
};

/**
 * Read `properties.geotype` when set; otherwise use brand defaults when `brand` is passed.
 */
export function geotypeFromFeature(
  feature: VenueGeotypeFeature,
  brand?: string
): string | null {
  const raw = feature.properties?.geotype;
  if (typeof raw === 'string' && raw.trim()) {
    const slug = normalizeGeotypeSlug(raw);
    return slug || null;
  }
  if (brand !== undefined) {
    return geotypeForBrand(brand);
  }
  return null;
}

/** Group features by geotype; skips features with no geotype unless `brand` supplies a default. */
export function partitionFeaturesByGeotype<T extends VenueGeotypeFeature>(
  features: T[],
  brand?: string
): Map<string, T[]> {
  const buckets = new Map<string, T[]>();
  for (const feature of features) {
    const geotype = geotypeFromFeature(feature, brand);
    if (!geotype) continue;
    const list = buckets.get(geotype) ?? [];
    list.push(feature);
    buckets.set(geotype, list);
  }
  return buckets;
}
