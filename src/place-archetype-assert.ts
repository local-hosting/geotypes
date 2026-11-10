import type {
  PlaceArchetype,
  PlaceExtent,
  PlaceLayerKind,
  PlaceMovement,
  PlacePolygonExtent,
  PlaceVertical,
} from './types/place-layout.js';

export const PLACE_ARCHETYPES: readonly PlaceArchetype[] = [
  'single_level',
  'indoor_stack',
  'campus',
  'open_area',
  'linear',
];

export const PLACE_EXTENTS: readonly PlaceExtent[] = ['footprint', 'site', 'area', 'route'];

export const PLACE_POLYGON_EXTENTS: readonly PlacePolygonExtent[] = ['footprint', 'site', 'area'];

export const PLACE_VERTICALS: readonly PlaceVertical[] = ['flat', 'stacked'];

export const PLACE_MOVEMENTS: readonly PlaceMovement[] = ['free', 'sequenced'];

/** Canonical layer order (coarse → fine) used when writing `layers:`. */
export const PLACE_LAYER_KINDS: readonly PlaceLayerKind[] = [
  'levels',
  'spaces',
  'openings',
  'markers',
  'stations',
  'gauges',
  'sensors',
  'routes',
  'visits',
  'assets',
];

export function assertPlaceLayerKind(value: unknown, context: string): PlaceLayerKind {
  return assertOneOf(PLACE_LAYER_KINDS, 'layer', value, context);
}

export function isPlaceArchetype(value: unknown): value is PlaceArchetype {
  return typeof value === 'string' && (PLACE_ARCHETYPES as readonly string[]).includes(value);
}

function assertOneOf<T extends string>(
  allowed: readonly T[],
  label: string,
  value: unknown,
  context: string,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`invalid ${label} "${String(value)}" (${context})`);
}

export function assertPlaceArchetype(value: unknown, context: string): PlaceArchetype {
  return assertOneOf(PLACE_ARCHETYPES, 'archetype', value, context);
}

export function assertPlaceExtent(value: unknown, context: string): PlaceExtent {
  return assertOneOf(PLACE_EXTENTS, 'extent', value, context);
}

export function assertPlacePolygonExtent(value: unknown, context: string): PlacePolygonExtent {
  return assertOneOf(PLACE_POLYGON_EXTENTS, 'polygon extent', value, context);
}

export function assertPlaceVertical(value: unknown, context: string): PlaceVertical {
  return assertOneOf(PLACE_VERTICALS, 'vertical', value, context);
}

export function assertPlaceMovement(value: unknown, context: string): PlaceMovement {
  return assertOneOf(PLACE_MOVEMENTS, 'movement', value, context);
}
