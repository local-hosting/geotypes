import { describe, expect, it } from 'vitest';

import {
  buildGeotypeTaxonomyDiagramArtboards,
  categoryLabelFromId,
  placeLabelFromSlug,
} from '../src/taxonomy-diagram.js';
import { GEOTYPE_ASSET_SLUGS } from '../src/generated/place-archetype-data.js';
import { GEOTYPE_SLUGS } from '../src/slugs.js';

describe('geotype taxonomy diagram', () => {
  it('formats category ids for labels', () => {
    expect(categoryLabelFromId('travel_and_transportation')).toBe('Travel And Transportation');
  });

  it('formats slug ids for place labels', () => {
    expect(placeLabelFromSlug('shopping_mall')).toBe('Shopping Mall');
  });

  it('lays out every valid extent × vertical cell and partitions every place slug', () => {
    const boards = buildGeotypeTaxonomyDiagramArtboards();
    const slugTotal = boards.reduce(
      (sum, board) =>
        sum + board.categories.reduce((inner, cat) => inner + cat.places.length, 0),
      0,
    );
    expect(boards.map((b) => `${b.id} ${b.gridSlot.col},${b.gridSlot.row} ${b.archetype}`)).toEqual([
      'footprint-flat 0,0 single_level',
      'site-flat 1,0 campus',
      'area-flat 2,0 open_area',
      'route-flat 3,0 linear',
      'network-flat 4,0 network',
      'footprint-stacked 0,1 indoor_stack',
      'site-stacked 1,1 campus',
    ]);
    expect(slugTotal).toBe(GEOTYPE_SLUGS.length - GEOTYPE_ASSET_SLUGS.length);
  });

  it('labels cells by extent × vertical', () => {
    const labels = buildGeotypeTaxonomyDiagramArtboards().map((b) => b.label);
    expect(labels).toContain('Footprint × stacked');
    expect(labels).toContain('Network × flat');
  });

  it('splits campus into flat and stacked sites', () => {
    const boards = buildGeotypeTaxonomyDiagramArtboards();
    const slugsIn = (id: string) => boards.find((b) => b.id === id)!.categories.flatMap((c) => c.places.map((p) => p.slug));
    expect(slugsIn('site-flat')).toContain('theme_park');
    expect(slugsIn('site-stacked')).toContain('hospital');
  });

  it('keeps hotel in the footprint × stacked cell', () => {
    const indoor = buildGeotypeTaxonomyDiagramArtboards().find((b) => b.id === 'footprint-stacked');
    const commercial = indoor?.categories.find((c) => c.category === 'commercial_services');
    expect(commercial?.places.some((place) => place.slug === 'hotel')).toBe(true);
  });
});
