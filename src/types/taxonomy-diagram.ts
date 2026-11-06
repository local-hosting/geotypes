import type { PlaceArchetype, PlaceAxes } from './place-layout.js';

export type GeotypeTaxonomyDiagramPlace = {
  slug: string;
  label: string;
};

export type GeotypeTaxonomyDiagramCategory = {
  id: string;
  category: string;
  label: string;
  places: readonly GeotypeTaxonomyDiagramPlace[];
};

/** One extent × vertical cell of the taxonomy grid (columns: extent, rows: vertical). */
export type GeotypeTaxonomyDiagramArtboard = {
  /** `${extent}-${vertical}`, e.g. `footprint-stacked`. */
  id: string;
  label: string;
  archetype: PlaceArchetype;
  axes: PlaceAxes;
  gridSlot: { col: number; row: number };
  categories: readonly GeotypeTaxonomyDiagramCategory[];
};
