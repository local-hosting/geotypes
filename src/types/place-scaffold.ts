export type PlaceArchetype = 'indoor_stack' | 'single_level' | 'campus' | 'linear';

export type LinearUnit = 'm' | 'ft';

export type SpaceGranularity = 'room' | 'zone' | 'building';

export type AuthoringScale = {
  linear_unit: LinearUnit;
  h3_resolution: number;
  space_granularity: SpaceGranularity;
};

/** Default place.yaml scaffold for a geotype slug (archetype + authoring scale). */
export type PlaceScaffold = {
  archetype: PlaceArchetype;
  authoring_scale: AuthoringScale;
};
