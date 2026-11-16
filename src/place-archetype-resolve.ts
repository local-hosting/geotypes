import { PLACE_ARCHETYPES, PLACE_LAYER_KINDS } from './place-archetype-assert.js';
import type {
  GeotypeLayoutMetaInput,
  PlaceArchetype,
  PlaceArchetypeAxes,
  PlaceArchetypeConfig,
  PlaceAxes,
  PlaceDecorations,
  PlaceExtent,
  PlaceLayerKind,
  PlaceVertical,
} from './types/place-layout.js';

/** Golden base per axes combination (spec/doc/place/place-archetypes.md). */
export const PLACE_ARCHETYPE_AXES: Record<PlaceArchetype, PlaceArchetypeAxes> = {
  single_level: { extent: 'footprint', vertical: 'flat', movement: 'free' },
  indoor_stack: { extent: 'footprint', vertical: 'stacked', movement: 'free' },
  campus: { extent: 'site', vertical: 'any', movement: 'free' },
  open_area: { extent: 'area', vertical: 'flat', movement: 'free' },
  linear: { extent: 'route', vertical: 'flat', movement: 'sequenced' },
};

/** Map-first extent from registry geometry (spec/doc/place/place-archetypes.md). */
function extentFromGeometry(slug: string, meta: GeotypeLayoutMetaInput, config: PlaceArchetypeConfig): PlaceExtent {
  const geometry = meta.geometry_type.trim().toLowerCase();
  switch (geometry) {
    case 'point':
      return 'footprint';
    case 'linestring':
      return 'route';
    case 'polygon': {
      const category = config.categories[meta.category.trim()];
      if (!category) {
        throw new Error(`slug ${slug}: category "${meta.category}" has no extent`);
      }
      return category.extent;
    }
    default:
      throw new Error(`slug ${slug}: unsupported geometry_type "${meta.geometry_type}"`);
  }
}

function defaultVertical(extent: PlaceExtent, categoryVertical: PlaceVertical | undefined): PlaceVertical {
  if (extent === 'footprint' || extent === 'site') return categoryVertical ?? 'flat';
  return 'flat';
}

/** Slug override → geometry → category defaults, one axis at a time. */
export function resolvePlaceAxes(
  slug: string,
  meta: GeotypeLayoutMetaInput,
  config: PlaceArchetypeConfig,
): PlaceAxes {
  const normalizedSlug = slug.trim().toLowerCase();
  const override = config.slugs[normalizedSlug] ?? {};
  const extent = override.extent ?? extentFromGeometry(normalizedSlug, meta, config);
  const vertical =
    override.vertical ?? defaultVertical(extent, config.categories[meta.category.trim()]?.vertical);
  const movement = override.movement ?? (extent === 'route' ? 'sequenced' : 'free');
  return { extent, vertical, movement };
}

/** Axes → archetype lookup; rejects combinations no golden base covers. */
export function archetypeForAxes(axes: PlaceAxes): PlaceArchetype {
  for (const archetype of PLACE_ARCHETYPES) {
    const rule = PLACE_ARCHETYPE_AXES[archetype];
    if (
      rule.extent === axes.extent &&
      rule.movement === axes.movement &&
      (rule.vertical === 'any' || rule.vertical === axes.vertical)
    ) {
      return archetype;
    }
  }
  throw new Error(
    `invalid place axes: extent=${axes.extent} vertical=${axes.vertical} movement=${axes.movement}`,
  );
}

/** Events: slug override → category → none. Layers: archetype ∪ category ∪ slug, canonical order. */
export function resolvePlaceDecorations(
  slug: string,
  meta: GeotypeLayoutMetaInput,
  archetype: PlaceArchetype,
  config: PlaceArchetypeConfig,
): PlaceDecorations {
  const override = config.slugs[slug.trim().toLowerCase()] ?? {};
  const category = config.categories[meta.category.trim()];
  const layers = new Set<PlaceLayerKind>([
    ...config.archetype_layers[archetype],
    ...(category?.layers ?? []),
    ...(override.layers ?? []),
  ]);
  return {
    events: [...(override.events ?? category?.events ?? [])],
    layers: PLACE_LAYER_KINDS.filter((kind) => layers.has(kind)),
  };
}

export function resolvePlaceArchetype(
  slug: string,
  meta: GeotypeLayoutMetaInput,
  config: PlaceArchetypeConfig,
): PlaceArchetype {
  return archetypeForAxes(resolvePlaceAxes(slug, meta, config));
}
