import { GEOTYPE_ASSET_BY_SLUG, GEOTYPE_LAYOUT_META_BY_SLUG } from './generated/place-archetype-data.js';
import { PLACE_ARCHETYPES, PLACE_EXTENTS, PLACE_VERTICALS } from './place-archetype-assert.js';
import { PLACE_ARCHETYPE_AXES } from './place-archetype-resolve.js';
import type { GeotypeKind, PlaceArchetype, PlaceAxes } from './types/place-layout.js';
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

function addPlace(
  byCell: Map<string, Map<string, GeotypeTaxonomyDiagramPlace[]>>,
  cellId: string,
  category: string,
  slug: string,
): void {
  const byCategory = byCell.get(cellId) ?? new Map<string, GeotypeTaxonomyDiagramPlace[]>();
  byCategory.set(category, [...(byCategory.get(category) ?? []), { slug, label: placeLabelFromSlug(slug) }]);
  byCell.set(cellId, byCategory);
}

/**
 * Extent × vertical grid, banded by category.
 * Pass `kind` to show only venues or only resources. Resource point assets (no place axes) sit on footprint × flat.
 * Omit `kind` to keep every place cell, including empty ones.
 */
export function buildGeotypeTaxonomyDiagramArtboards(kind?: GeotypeKind): GeotypeTaxonomyDiagramArtboard[] {
  const byCell = new Map<string, Map<string, GeotypeTaxonomyDiagramPlace[]>>();
  for (const [slug, meta] of Object.entries(GEOTYPE_LAYOUT_META_BY_SLUG)) {
    if (kind && meta.kind !== kind) continue;
    addPlace(byCell, axesCellId(meta), meta.category, slug);
  }
  if (kind === 'resource') {
    for (const [slug, meta] of Object.entries(GEOTYPE_ASSET_BY_SLUG)) {
      addPlace(byCell, 'footprint-flat', meta.category, slug);
    }
  }

  const boards = getAxesCells()
    .map(({ axes, archetype }) => {
      const id = axesCellId(axes);
      return {
        id,
        label: axesCellLabel(axes),
        archetype,
        axes,
        gridSlot: { col: PLACE_EXTENTS.indexOf(axes.extent), row: PLACE_VERTICALS.indexOf(axes.vertical) },
        categories: getCategories(id, byCell.get(id) ?? new Map()),
      };
    })
    .filter((board) => !kind || board.categories.length > 0);
  if (!kind) return boards;
  return boards.map((board, index) => ({
    ...board,
    gridSlot: { col: index % PLACE_EXTENTS.length, row: Math.floor(index / PLACE_EXTENTS.length) },
  }));
}
