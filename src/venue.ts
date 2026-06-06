import { geotypeForBrand } from './brand-crosswalk.js';
import { normalizeGeotypeSlug } from './normalize.js';

export type VenueGeotypeFeature = {
  type?: string;
  properties?: Record<string, unknown>;
};

export function geotypeFromFeature(
  feature: VenueGeotypeFeature,
  brand: string
): string {
  const raw = feature.properties?.geotype;
  if (typeof raw === 'string' && raw.trim()) {
    return normalizeGeotypeSlug(raw);
  }
  return geotypeForBrand(brand);
}

export function partitionFeaturesByGeotype<T extends VenueGeotypeFeature>(
  features: T[],
  brand: string
): Map<string, T[]> {
  const buckets = new Map<string, T[]>();
  for (const feature of features) {
    const geotype = geotypeFromFeature(feature, brand);
    const list = buckets.get(geotype) ?? [];
    list.push(feature);
    buckets.set(geotype, list);
  }
  return buckets;
}
