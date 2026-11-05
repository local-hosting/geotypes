import { GEOTYPE_LAYOUT_META_BY_SLUG } from './generated/geotype-layout-meta.js';
import { PLACE_ARCHETYPE_CONFIG } from './generated/place-archetype-config.js';
import { normalizeGeotypeSlug } from './normalize.js';
import {
  placeScaffoldForArchetype,
  resolvePlaceArchetype,
} from './resolve-place-archetype.js';
import { resolveGeotypeRef, type GeotypeRef } from './resolve-ref.js';
import type { PlaceScaffold } from './types/place-scaffold.js';

export type {
  AuthoringScale,
  PlaceArchetype,
  PlaceScaffold,
  LinearUnit,
  SpaceGranularity,
} from './types/place-scaffold.js';

function lookupPlaceScaffold(slug: string): PlaceScaffold | null {
  const normalized = normalizeGeotypeSlug(slug);
  if (!normalized) return null;
  const meta =
    GEOTYPE_LAYOUT_META_BY_SLUG[normalized as keyof typeof GEOTYPE_LAYOUT_META_BY_SLUG];
  if (!meta) return null;
  const archetype = resolvePlaceArchetype(normalized, meta, PLACE_ARCHETYPE_CONFIG);
  return placeScaffoldForArchetype(archetype, PLACE_ARCHETYPE_CONFIG);
}

export function placeScaffoldForSlug(slug: string): PlaceScaffold | null {
  return lookupPlaceScaffold(slug);
}

export function placeScaffoldForGeotypeRef(ref: GeotypeRef): PlaceScaffold | null {
  const resolved = resolveGeotypeRef(ref);
  if (!resolved) return null;
  return lookupPlaceScaffold(resolved.slug);
}
