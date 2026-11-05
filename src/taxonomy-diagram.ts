import {
  GEOTYPE_LAYOUT_META_BY_SLUG,
  PLACE_ARCHETYPE_CONFIG,
} from './generated/place-archetype-data.js';
import { resolvePlaceArchetype } from './place-archetype.js';
import type { PlaceArchetype } from './types/place-layout.js';
import type {
  GeotypeTaxonomyDiagramArtboard,
  GeotypeTaxonomyDiagramCategory,
} from './types/taxonomy-diagram.js';

export type {
  GeotypeTaxonomyDiagramArtboard,
  GeotypeTaxonomyDiagramCategory,
} from './types/taxonomy-diagram.js';

const ARCHETYPE_ORDER: readonly PlaceArchetype[] = [
  'single_level',
  'campus',
  'linear',
  'indoor_stack',
];

const ARCHETYPE_LABELS: Record<PlaceArchetype, string> = {
  single_level: 'Single level',
  campus: 'Campus',
  linear: 'Linear',
  indoor_stack: 'Indoor stack',
};

export function categoryLabelFromId(categoryId: string): string {
  return categoryId
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Category bands per resolved place archetype (for isocanvas / diagram hosts). */
export function buildGeotypeTaxonomyDiagramArtboards(): GeotypeTaxonomyDiagramArtboard[] {
  const counts = new Map<PlaceArchetype, Map<string, number>>();
  for (const archetype of ARCHETYPE_ORDER) {
    counts.set(archetype, new Map());
  }

  for (const [slug, meta] of Object.entries(GEOTYPE_LAYOUT_META_BY_SLUG)) {
    const archetype = resolvePlaceArchetype(slug, meta, PLACE_ARCHETYPE_CONFIG);
    const byCategory = counts.get(archetype);
    if (!byCategory) {
      continue;
    }
    byCategory.set(meta.category, (byCategory.get(meta.category) ?? 0) + 1);
  }

  return ARCHETYPE_ORDER.map((archetype) => {
    const byCategory = counts.get(archetype) ?? new Map<string, number>();
    const categories: GeotypeTaxonomyDiagramCategory[] = [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .map(([category, slugCount]) => ({
        id: `${archetype}:${category}`,
        category,
        label: categoryLabelFromId(category),
        slugCount,
      }));

    return {
      id: archetype,
      label: ARCHETYPE_LABELS[archetype],
      categories,
    };
  });
}
