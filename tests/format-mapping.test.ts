import { describe, expect, it } from 'vitest';

import { geotypeSlugForMapping } from '../src/format-mapping.js';

describe('geotypeSlugForMapping', () => {
  it('resolves bridge format tokens from generated tables', () => {
    expect(geotypeSlugForMapping('imdf', 'museum')).toBe('museum');
    expect(geotypeSlugForMapping('gtfs', 'station')).toBe('train_station');
  });
});
