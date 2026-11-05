export {
  BRAND_GEOTYPE_DEFAULTS,
  VENUE_GEOTYPE_FALLBACK,
  geotypeForBrand,
} from './brand-crosswalk.js';
export { normalizeGeotypeSlug, resolveGeotypeSlug } from './normalize.js';
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
export { resolveGeotypeRef, type GeotypeRef, type ResolvedGeotype } from './resolve-ref.js';
export {
  geotypeFromFeature,
  partitionFeaturesByGeotype,
  type VenueGeotypeFeature,
} from './venue.js';
