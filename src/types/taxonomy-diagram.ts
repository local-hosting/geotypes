import type { PlaceArchetype } from './place-scaffold.js';

export type GeotypeTaxonomyDiagramCategory = {
  id: string;
  category: string;
  label: string;
  slugCount: number;
};

export type GeotypeTaxonomyDiagramArtboard = {
  id: PlaceArchetype;
  label: string;
  categories: GeotypeTaxonomyDiagramCategory[];
};
