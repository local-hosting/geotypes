import { describe, expect, it } from 'vitest';

import { placeScaffoldForGeotypeRef, placeScaffoldForSlug } from '../src/place-scaffold.js';

describe('place scaffolds (map-first)', () => {
  it('maps shopping_mall to campus and zone scale (mall property on maps)', () => {
    const scaffold = placeScaffoldForSlug('shopping_mall');
    expect(scaffold).toEqual({
      archetype: 'campus',
      authoring_scale: {
        linear_unit: 'm',
        h3_resolution: 9,
        space_granularity: 'zone',
      },
    });
  });

  it('maps linestring geotypes to linear archetype', () => {
    const scaffold = placeScaffoldForSlug('creek');
    expect(scaffold?.archetype).toBe('linear');
    expect(scaffold?.authoring_scale.space_granularity).toBe('zone');
  });

  it('maps airport to campus archetype', () => {
    expect(placeScaffoldForSlug('airport')?.archetype).toBe('campus');
  });

  it('resolves from geotype ref', () => {
    expect(placeScaffoldForGeotypeRef('shopping_mall')?.archetype).toBe('campus');
  });

  it('returns null for unknown slug', () => {
    expect(placeScaffoldForSlug('not_a_real_type')).toBeNull();
  });
});
