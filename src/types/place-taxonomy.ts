/** Place-search taxonomy resolver contract (`@local-hosting/geotypes/geokit`). */
export type PlaceSearchProvider =
  | 'foursquare'
  | 'google-places'
  | 'here-places'
  | 'osm'
  | 'esri-places';

export type GeotypeRef = string;

export type ResolvedGeotype = {
  acronym: string;
  slug: string;
};

export type PlaceTaxonomyResolver = {
  resolve(ref: GeotypeRef): ResolvedGeotype | null;
  toProviderCategories(refs: GeotypeRef[], provider: PlaceSearchProvider): string[];
  fromProviderCategory(value: string, provider: PlaceSearchProvider): string | null;
};
