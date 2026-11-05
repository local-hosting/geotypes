import { describe, expect, it } from 'vitest';
import { createGeokitTaxonomyResolver } from '../src/geokit-adapter.js';

describe('@twinfile/geotypes/geokit', () => {
  const resolver = createGeokitTaxonomyResolver();

  it('resolves acronym RSE to electronics_store', () => {
    expect(resolver.resolve('RSE')).toEqual({
      acronym: 'RSE',
      slug: 'electronics_store',
    });
  });

  it('maps RSE to Foursquare category id', () => {
    const fsq = resolver.toProviderCategories(['RSE'], 'foursquare');
    expect(fsq).toContain('4bf58dd8d48988d122951735');
  });

  it('reverse maps Foursquare id to slug', () => {
    const slug = resolver.fromProviderCategory('4bf58dd8d48988d122951735', 'foursquare');
    expect(slug).toBe('electronics_store');
  });

  it('maps RSE to OSM shop tag', () => {
    const tags = resolver.toProviderCategories(['RSE'], 'osm');
    expect(tags).toContain('shop=electronics');
  });
});
