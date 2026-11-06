import {
  GEOTYPE_ASSET_SLUGS,
  GEOTYPE_LAYOUT_META_BY_SLUG,
  PLACE_ARCHETYPE_CONFIG,
} from './generated/place-archetype-data.js';
import { resolvePlaceArchetype } from './place-archetype-resolve.js';
import { normalizeGeotypeSlug } from './normalize.js';
import { resolveGeotypeRef, type GeotypeRef } from './resolve-ref.js';
import type {
  GeotypeKind,
  GeotypeLayoutMeta,
  GeotypeLayoutMetaInput,
  PlaceArchetype,
  PlaceArchetypeConfig,
  PlaceAxes,
  PlaceDecorations,
  PlaceScaffold,
} from './types/place-layout.js';

export type {
  PlaceDecorations,
  PlaceLayerKind,
  AuthoringScale,
  GeotypeLayoutMeta,
  GeotypeLayoutMetaInput,
  PlaceArchetype,
  PlaceArchetypeAxes,
  PlaceArchetypeConfig,
  PlaceAxes,
  PlaceExtent,
  PlaceMovement,
  GeotypeKind,
  PlaceScaffold,
  PlaceVertical,
  LinearUnit,
  SpaceGranularity,
} from './types/place-layout.js';

export {
  archetypeForAxes,
  PLACE_ARCHETYPE_AXES,
  resolvePlaceArchetype,
  resolvePlaceAxes,
  resolvePlaceDecorations,
} from './place-archetype-resolve.js';
export { isPlaceArchetype, PLACE_ARCHETYPES, PLACE_LAYER_KINDS } from './place-archetype-assert.js';

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

function getLayoutMeta(slug: string): GeotypeLayoutMeta | null {
  const normalized = normalizeGeotypeSlug(slug);
  if (!normalized) return null;
  return GEOTYPE_LAYOUT_META_BY_SLUG[normalized as keyof typeof GEOTYPE_LAYOUT_META_BY_SLUG] ?? null;
}

/** Default `place.yaml` starter for a geotype slug (`archetype` + `authoring_scale`). */
export function placeScaffoldForSlug(slug: string): PlaceScaffold | null {
  const meta = getLayoutMeta(slug);
  return meta ? placeScaffoldForArchetype(meta.archetype, PLACE_ARCHETYPE_CONFIG) : null;
}

export function placeScaffoldForGeotypeRef(ref: GeotypeRef): PlaceScaffold | null {
  const resolved = resolveGeotypeRef(ref);
  if (!resolved) return null;
  return placeScaffoldForSlug(resolved.slug);
}

/** Materialized extent / vertical / movement for a geotype slug. */
export function placeAxesForSlug(slug: string): PlaceAxes | null {
  const meta = getLayoutMeta(slug);
  return meta ? { extent: meta.extent, vertical: meta.vertical, movement: meta.movement } : null;
}

/** `venue` for an occupiable place, `resource` for equipment and conveyance (including point assets). */
export function geotypeKindForSlug(slug: string): GeotypeKind | null {
  const meta = getLayoutMeta(slug);
  if (meta) return meta.kind;
  if (isAssetGeotype(slug)) return 'resource';
  return null;
}

/** Point assets with no interior (signs, hydrants, poles): `assets.yaml` kinds, not places. */
export function isAssetGeotype(slug: string): boolean {
  const normalized = normalizeGeotypeSlug(slug);
  return !!normalized && (GEOTYPE_ASSET_SLUGS as readonly string[]).includes(normalized);
}

/** Suggested situations + decoration layers for a geotype slug. */
export function placeDecorationsForSlug(slug: string): PlaceDecorations | null {
  const meta = getLayoutMeta(slug);
  return meta ? { situations: [...meta.situations], layers: [...meta.layers] } : null;
}

/** Recompute archetype from rules (must match yarn sync:place-archetypes output). */
export function resolvePlaceArchetypeForSlug(
  slug: string,
  meta: GeotypeLayoutMetaInput,
  config: PlaceArchetypeConfig = PLACE_ARCHETYPE_CONFIG,
): PlaceArchetype {
  return resolvePlaceArchetype(slug, meta, config);
}
