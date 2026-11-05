import type {
  AuthoringScale,
  PlaceArchetype,
  PlaceScaffold,
} from './types/place-scaffold.js';

export type PlaceArchetypeConfig = {
  archetype_defaults: Record<PlaceArchetype, AuthoringScale>;
  categories: Record<string, { archetype: PlaceArchetype }>;
  slugs: Record<string, { archetype: PlaceArchetype }>;
};

export type GeotypeLayoutMeta = {
  category: string;
  geometry_type: string;
};

export function assertPlaceArchetype(value: string, context: string): PlaceArchetype {
  if (
    value === 'indoor_stack' ||
    value === 'single_level' ||
    value === 'campus' ||
    value === 'linear'
  ) {
    return value;
  }
  throw new Error(`invalid archetype "${value}" (${context})`);
}

/** Map-first defaults when category/slug do not override (see spec world.md). */
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
