import { describe, expect, it } from 'vitest';
import {
  BRAND_GEOTYPE_DEFAULTS,
  GEOTYPE_SLUGS,
  geotypeForBrand,
  geotypeFromFeature,
  isKnownGeotypeSlug,
  normalizeGeotypeSlug,
  partitionFeaturesByGeotype,
} from '../src/index.js';

describe('@twinfile/geotypes', () => {
  it('exports synced taxonomy slugs', () => {
    expect(GEOTYPE_SLUGS.length).toBeGreaterThan(200);
    expect(isKnownGeotypeSlug('electronics_store')).toBe(true);
    expect(isKnownGeotypeSlug('not_a_real_type')).toBe(false);
  });

  it('normalizes free text to slug form', () => {
    expect(normalizeGeotypeSlug('Electronics Store')).toBe('electronics_store');
  });

  it('maps carrier brands to electronics_store', () => {
    expect(geotypeForBrand('retail')).toBe('electronics_store');
    expect(BRAND_GEOTYPE_DEFAULTS.ikea).toBe('furniture_store');
  });

  it('prefers properties.geotype on features', () => {
    expect(
      geotypeFromFeature(
        { properties: { geotype: 'grocery_store' } },
        'retail'
      )
    ).toBe('grocery_store');
  });

  it('partitions venue features by geotype', () => {
    const buckets = partitionFeaturesByGeotype(
      [{ properties: {} }, { properties: { geotype: 'furniture_store' } }],
      'ikea'
    );
    expect(buckets.get('furniture_store')).toHaveLength(2);
  });
});
