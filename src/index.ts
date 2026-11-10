export {
  BRAND_GEOTYPE_DEFAULTS,
  VENUE_GEOTYPE_FALLBACK,
  geotypeForBrand,
} from './brand-crosswalk.js';
export { normalizeGeotypeSlug, resolveGeotypeSlug } from './normalize.js';
export { geotypeSlugForMapping } from './format-mapping.js';
export {
  GEOTYPE_SLUGS,
  type GeotypeSlug,
  isKnownGeotypeSlug,
} from './slugs.js';
export {
  GEOTYPE_BY_ACRONYM,
  GEOTYPE_ACRONYM_BY_SLUG,
  type GeotypeAcronym,
  acronymToSlug,
  slugToAcronym,
  isKnownGeotypeAcronym,
} from './generated/acronyms.js';
export {
  FSQ_CATEGORY_ID_BY_SLUG,
  GOOGLE_TYPE_BY_SLUG,
  ESRI_LABEL_BY_SLUG,
  ESRI_CATEGORY_ID_BY_SLUG,
  SCHEMA_ORG_TYPE_BY_SLUG,
} from './generated/provider-categories.js';
export {
  schemaOrgTypeForGeotypeRef,
  schemaOrgTypeForSlug,
  schemaOrgUriForGeotypeRef,
  schemaOrgUriForSlug,
} from './schema-org.js';
export {
  archetypeForAxes,
  geotypeKindForSlug,
  isAssetGeotype,
  isPlaceArchetype,
  PLACE_ARCHETYPE_AXES,
  PLACE_ARCHETYPES,
  PLACE_LAYER_KINDS,
  placeAxesForSlug,
  placeDecorationsForSlug,
  placeScaffoldForGeotypeRef,
  placeScaffoldForSlug,
  suggestBuildingImportForSlug,
  resolvePlaceAxes,
  type GeotypeKind,
  type AuthoringScale,
  type PlaceArchetype,
  type PlaceArchetypeAxes,
  type PlaceAxes,
  type PlaceDecorations,
  type PlaceExtent,
  type PlaceLayerKind,
  type PlaceMovement,
  type PlaceScaffold,
  type PlaceVertical,
  type LinearUnit,
  type SpaceGranularity,
} from './place-archetype.js';
export { resolveGeotypeRef, type GeotypeRef, type ResolvedGeotype } from './resolve-ref.js';
export {
  geotypeFromFeature,
  partitionFeaturesByGeotype,
  type VenueGeotypeFeature,
} from './venue.js';
export {
  buildGeotypeTaxonomyDiagramArtboards,
  categoryLabelFromId,
  placeLabelFromSlug,
  type GeotypeTaxonomyDiagramArtboard,
  type GeotypeTaxonomyDiagramCategory,
  type GeotypeTaxonomyDiagramPlace,
} from './taxonomy-diagram.js';
