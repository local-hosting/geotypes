import { describe, expect, it } from 'vitest';

import {
  buildGeotypeTaxonomyDiagramArtboards,
  categoryLabelFromId,
} from '../src/taxonomy-diagram.js';
import { GEOTYPE_SLUGS } from '../src/slugs.js';

describe('geotype taxonomy diagram', () => {
  it('formats category ids for labels', () => {
    expect(categoryLabelFromId('travel_and_transportation')).toBe('Travel And Transportation');
  });

  it('partitions every slug into one archetype artboard', () => {
    const boards = buildGeotypeTaxonomyDiagramArtboards();
    const slugTotal = boards.reduce(
      (sum, board) => sum + board.categories.reduce((inner, cat) => inner + cat.slugCount, 0),
      0,
    );
    expect(boards.map((b) => b.id)).toEqual([
      'single_level',
      'campus',
      'linear',
      'indoor_stack',
    ]);
    expect(slugTotal).toBe(GEOTYPE_SLUGS.length);
  });

  it('keeps shopping_mall on the campus band', () => {
    const campus = buildGeotypeTaxonomyDiagramArtboards().find((b) => b.id === 'campus');
    const retail = campus?.categories.find((c) => c.category === 'retail');
    expect(retail?.slugCount).toBeGreaterThan(0);
  });
});
