import { GEOTYPE_LAYOUT_META_BY_SLUG } from './generated/place-archetype-data.js';
import { PLACE_ARCHETYPES, PLACE_EXTENTS, PLACE_VERTICALS } from './place-archetype-assert.js';
import { PLACE_ARCHETYPE_AXES } from './place-archetype-resolve.js';
import type { PlaceArchetype, PlaceAxes } from './types/place-layout.js';
import type {
  GeotypeTaxonomyDiagramArtboard,
  GeotypeTaxonomyDiagramCategory,
  GeotypeTaxonomyDiagramPlace,
} from './types/taxonomy-diagram.js';

export type {
  GeotypeTaxonomyDiagramArtboard,
  GeotypeTaxonomyDiagramCategory,
  GeotypeTaxonomyDiagramPlace,
} from './types/taxonomy-diagram.js';

export function categoryLabelFromId(categoryId: string): string {
  return categoryId
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Human label for a geotype slug on diagram cubes. */
export function placeLabelFromSlug(slug: string): string {
  return categoryLabelFromId(slug);
}

function axesCellId(axes: Pick<PlaceAxes, 'extent' | 'vertical'>): string {
  return `${axes.extent}-${axes.vertical}`;
}

/** "Footprint × stacked" — kept short; the isocanvas cell badge is one line (~19 chars). */
function axesCellLabel(axes: PlaceAxes): string {
  return `${categoryLabelFromId(axes.extent)} × ${axes.vertical}`;
}

/** Every valid extent × vertical cell, row-major (flat row, then stacked). */
function getAxesCells(): Array<{ axes: PlaceAxes; archetype: PlaceArchetype }> {
  const cells: Array<{ axes: PlaceAxes; archetype: PlaceArchetype }> = [];
  for (const archetype of PLACE_ARCHETYPES) {
    const rule = PLACE_ARCHETYPE_AXES[archetype];
    const verticals = rule.vertical === 'any' ? PLACE_VERTICALS : [rule.vertical];
    for (const vertical of verticals) {
      cells.push({ axes: { extent: rule.extent, vertical, movement: rule.movement }, archetype });
    }
  }
  const rank = ({ axes }: (typeof cells)[number]) =>
    PLACE_VERTICALS.indexOf(axes.vertical) * PLACE_EXTENTS.length + PLACE_EXTENTS.indexOf(axes.extent);
  return cells.sort((a, b) => rank(a) - rank(b));
}

function getCategories(id: string, places: Map<string, GeotypeTaxonomyDiagramPlace[]>): GeotypeTaxonomyDiagramCategory[] {
  return [...places.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([category, rows]) => ({
      id: `${id}:${category}`,
      category,
      label: categoryLabelFromId(category),
      places: [...rows].sort((a, b) => a.slug.localeCompare(b.slug)),
    }));
}

/** Extent × vertical grid of place geotypes, banded by category (from GEOTYPE_LAYOUT_META_BY_SLUG axes). */
export function buildGeotypeTaxonomyDiagramArtboards(): GeotypeTaxonomyDiagramArtboard[] {
  const byCell = new Map<string, Map<string, GeotypeTaxonomyDiagramPlace[]>>();
  for (const [slug, meta] of Object.entries(GEOTYPE_LAYOUT_META_BY_SLUG)) {
    const id = axesCellId(meta);
    const byCategory = byCell.get(id) ?? new Map<string, GeotypeTaxonomyDiagramPlace[]>();
    byCategory.set(meta.category, [...(byCategory.get(meta.category) ?? []), { slug, label: placeLabelFromSlug(slug) }]);
    byCell.set(id, byCategory);
  }

  return getAxesCells().map(({ axes, archetype }) => {
    const id = axesCellId(axes);
    return {
      id,
      label: axesCellLabel(axes),
      archetype,
      axes,
      gridSlot: { col: PLACE_EXTENTS.indexOf(axes.extent), row: PLACE_VERTICALS.indexOf(axes.vertical) },
      categories: getCategories(id, byCell.get(id) ?? new Map()),
    };
  });
}
