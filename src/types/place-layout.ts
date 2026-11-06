export type PlaceArchetype =
  | 'indoor_stack'
  | 'single_level'
  | 'campus'
  | 'open_area'
  | 'linear';

/** What public maps show first (spec/doc/place/place-archetypes.md). */
export type PlaceExtent = 'footprint' | 'site' | 'area' | 'route';

/** Polygon extents a category may default to. */
export type PlacePolygonExtent = Extract<PlaceExtent, 'footprint' | 'site' | 'area'>;

export type PlaceVertical = 'flat' | 'stacked';

export type PlaceMovement = 'free' | 'sequenced';

export type PlaceAxes = {
  extent: PlaceExtent;
  vertical: PlaceVertical;
  movement: PlaceMovement;
};

/** Axes an archetype requires; `any` vertical means the base allows either. */
export type PlaceArchetypeAxes = Omit<PlaceAxes, 'vertical'> & {
  vertical: PlaceVertical | 'any';
};

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

/** Place layer files (`place/<kind>.yaml`) a twin can be decorated with. */
export type PlaceLayerKind =
  | 'levels'
  | 'spaces'
  | 'openings'
  | 'access_points'
  | 'stations'
  | 'gauges'
  | 'sensors'
  | 'routes'
  | 'visits'
  | 'assets';

/** Suggested decorators on top of the archetype base (spec/doc/place/decorate-twin.md). */
export type PlaceDecorations = {
  situations: readonly string[];
  layers: readonly PlaceLayerKind[];
};

/** Category root defaults (`data/category/*.yml`). */
export type PlaceCategoryDefaults = {
  extent: PlacePolygonExtent;
  vertical?: PlaceVertical;
  situations?: readonly string[];
  layers?: readonly PlaceLayerKind[];
};

/** Per-slug overrides: any axis, plus situations (replace) and layers (added). */
export type PlaceSlugOverride = Partial<PlaceAxes> & Partial<PlaceDecorations>;

export type PlaceArchetypeConfig = {
  archetype_defaults: Record<PlaceArchetype, AuthoringScale>;
  archetype_layers: Record<PlaceArchetype, readonly PlaceLayerKind[]>;
  situations: readonly string[];
  categories: Record<string, PlaceCategoryDefaults>;
  slugs: Record<string, PlaceSlugOverride>;
};

/** Slug row inputs used when resolving archetype (sync / tests). */
export type GeotypeLayoutMetaInput = {
  category: string;
  geometry_type: string;
};

/** Per-slug layout metadata (generated includes resolved axes, `archetype`, decorations). */
export type GeotypeLayoutMeta = GeotypeLayoutMetaInput &
  PlaceAxes &
  PlaceDecorations & {
    archetype: PlaceArchetype;
  };
