import {
  GEOTYPE_LAYOUT_META_BY_SLUG,
  PLACE_ARCHETYPE_CONFIG,
} from './generated/place-archetype-data.js';
import { assertPlaceArchetype } from './place-archetype-assert.js';
import { normalizeGeotypeSlug } from './normalize.js';
import { resolveGeotypeRef, type GeotypeRef } from './resolve-ref.js';
import type {
  GeotypeLayoutMeta,
  PlaceArchetype,
  PlaceArchetypeConfig,
  PlaceScaffold,
} from './types/place-layout.js';

export type {
  AuthoringScale,
  GeotypeLayoutMeta,
  PlaceArchetype,
  PlaceArchetypeConfig,
  PlaceScaffold,
  LinearUnit,
  SpaceGranularity,
} from './types/place-layout.js';

/** Map-first defaults when category/slug do not override (see spec doc/place/place.md). */
export function resolvePlaceArchetype(
  slug: string,
  meta: GeotypeLayoutMeta,
  config: PlaceArchetypeConfig,
): PlaceArchetype {
  const normalizedSlug = slug.trim().toLowerCase();
  const slugOverride = config.slugs[normalizedSlug];
  if (slugOverride?.archetype) {
    return assertPlaceArchetype(slugOverride.archetype, `slug ${normalizedSlug}`);
  }
  if (meta.geometry_type === 'linestring') {
    return 'linear';
  }
  const category = meta.category.trim();
  const categoryDefault = config.categories[category];
  if (categoryDefault?.archetype) {
    return assertPlaceArchetype(categoryDefault.archetype, `category ${category}`);
  }
  if (meta.geometry_type === 'polygon') {
    return 'campus';
  }
  return 'single_level';
}

export function placeScaffoldForArchetype(
  archetype: PlaceArchetype,
  config: PlaceArchetypeConfig,
): PlaceScaffold {
  const authoring_scale = config.archetype_defaults[archetype];
  if (!authoring_scale) {
    throw new Error(`missing archetype_defaults.${archetype}`);
  }
  return {
    archetype,
    authoring_scale: { ...authoring_scale },
  };
}

function lookupPlaceScaffold(slug: string): PlaceScaffold | null {
  const normalized = normalizeGeotypeSlug(slug);
  if (!normalized) return null;
  const meta =
    GEOTYPE_LAYOUT_META_BY_SLUG[normalized as keyof typeof GEOTYPE_LAYOUT_META_BY_SLUG];
  if (!meta) return null;
  const archetype = resolvePlaceArchetype(normalized, meta, PLACE_ARCHETYPE_CONFIG);
  return placeScaffoldForArchetype(archetype, PLACE_ARCHETYPE_CONFIG);
}

/** Default `place.yaml` starter for a geotype slug (`archetype` + `authoring_scale`). */
export function placeScaffoldForSlug(slug: string): PlaceScaffold | null {
  return lookupPlaceScaffold(slug);
}

export function placeScaffoldForGeotypeRef(ref: GeotypeRef): PlaceScaffold | null {
  const resolved = resolveGeotypeRef(ref);
  if (!resolved) return null;
  return lookupPlaceScaffold(resolved.slug);
}
