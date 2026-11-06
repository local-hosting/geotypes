import { describe, expect, it } from 'vitest';

import { vizTaxonomyPlaceLabelTwoLines } from '../src/viz/taxonomy-label-format.js';

describe('vizTaxonomyPlaceLabelTwoLines', () => {
  it('splits on spaces into two balanced lines when there are two or more words', () => {
    expect(vizTaxonomyPlaceLabelTwoLines('Shopping Mall')).toBe('Shopping\nMall');
    expect(vizTaxonomyPlaceLabelTwoLines('a b c d')).toBe('a b\nc d');
  });

  it('does not break single words', () => {
    expect(vizTaxonomyPlaceLabelTwoLines('Mall')).toBe('Mall');
    expect(vizTaxonomyPlaceLabelTwoLines('Supercalifragilistic')).toBe('Supercalifragilistic');
  });

  it('trims surrounding whitespace', () => {
    expect(vizTaxonomyPlaceLabelTwoLines('  Foo Bar  ')).toBe('Foo\nBar');
  });
});
