import type { PlaceArchetype } from './place-layout.js';

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
