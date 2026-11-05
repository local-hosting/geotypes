export type PlaceArchetype = 'indoor_stack' | 'single_level' | 'campus' | 'linear';

export type LinearUnit = 'm' | 'ft';

export type SpaceGranularity = 'room' | 'zone' | 'building';

export type AuthoringScale = {
  linear_unit: LinearUnit;
  h3_resolution: number;
  space_granularity: SpaceGranularity;
};

/** Default `place.yaml` starter for a geotype slug (`archetype` + `authoring_scale`). */
export type PlaceScaffold = {
  archetype: PlaceArchetype;
  authoring_scale: AuthoringScale;
};

export type PlaceArchetypeConfig = {
  archetype_defaults: Record<PlaceArchetype, AuthoringScale>;
  categories: Record<string, { archetype: PlaceArchetype }>;
  slugs: Record<string, { archetype: PlaceArchetype }>;
};

export type GeotypeLayoutMeta = {
  category: string;
  geometry_type: string;
};
