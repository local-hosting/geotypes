import type {
  PlaceSearchProvider,
  PlaceTaxonomyResolver,
  ResolvedGeotype,
} from './types/place-taxonomy.js';

import {
  ESRI_CATEGORY_ID_BY_SLUG,
  ESRI_LABEL_BY_SLUG,
  ESRI_SLUG_BY_LABEL,
  FSQ_CATEGORY_ID_BY_SLUG,
  FSQ_SLUG_BY_CATEGORY_ID,
  GOOGLE_SLUG_BY_TYPE,
  GOOGLE_TYPE_BY_SLUG,
  HERE_CODE_BY_SLUG,
  OSM_TAG_BY_SLUG,
} from './generated/provider-categories.js';
import { resolveGeotypeRef, type GeotypeRef } from './resolve-ref.js';
import { normalizeGeotypeSlug } from './normalize.js';
import { isKnownGeotypeSlug } from './slugs.js';

function refToSlug(ref: GeotypeRef): string | null {
  return resolveGeotypeRef(ref)?.slug ?? null;
}

function invertStringMap(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slug, value] of Object.entries(map)) {
    out[value] = slug;
  }
  return out;
}

const HERE_SLUG_BY_CODE = invertStringMap(HERE_CODE_BY_SLUG as Record<string, string>);
const OSM_SLUG_BY_TAG = invertStringMap(OSM_TAG_BY_SLUG as Record<string, string>);

export function createGeokitTaxonomyResolver(): PlaceTaxonomyResolver {
  return {
    resolve(ref: GeotypeRef): ResolvedGeotype | null {
      return resolveGeotypeRef(ref);
    },

    toProviderCategories(refs: GeotypeRef[], provider: PlaceSearchProvider): string[] {
      const out = new Set<string>();
      for (const ref of refs) {
        const slug = refToSlug(ref);
        if (!slug) continue;
        if (provider === 'foursquare') {
          const id = (FSQ_CATEGORY_ID_BY_SLUG as Record<string, string>)[slug];
          if (id) out.add(id);
        } else if (provider === 'google-places') {
          const type = (GOOGLE_TYPE_BY_SLUG as Record<string, string>)[slug];
          if (type) out.add(type);
        } else if (provider === 'here-places') {
          const code = (HERE_CODE_BY_SLUG as Record<string, string>)[slug];
          if (code) out.add(code);
        } else if (provider === 'osm') {
          const tag = (OSM_TAG_BY_SLUG as Record<string, string>)[slug];
          if (tag) out.add(tag);
        } else if (provider === 'esri-places') {
          const categoryId = (ESRI_CATEGORY_ID_BY_SLUG as Record<string, string>)[slug];
          if (categoryId) out.add(categoryId);
          else {
            const label = (ESRI_LABEL_BY_SLUG as Record<string, string>)[slug];
            if (label) out.add(label);
          }
        }
      }
      return [...out];
    },

    fromProviderCategory(value: string, provider: PlaceSearchProvider): string | null {
      if (!value.trim()) return null;
      if (provider === 'foursquare') {
        return (FSQ_SLUG_BY_CATEGORY_ID as Record<string, string>)[value] ?? null;
      }
      if (provider === 'google-places') {
        const direct = (GOOGLE_SLUG_BY_TYPE as Record<string, string>)[value];
        if (direct) return direct;
        const slug = normalizeGeotypeSlug(value);
        return slug && isKnownGeotypeSlug(slug) ? slug : null;
      }
      if (provider === 'here-places') {
        return HERE_SLUG_BY_CODE[value] ?? null;
      }
      if (provider === 'osm') {
        return OSM_SLUG_BY_TAG[value] ?? null;
      }
      if (provider === 'esri-places') {
        const byId = (FSQ_SLUG_BY_CATEGORY_ID as Record<string, string>)[value];
        if (byId) return byId;
        return (ESRI_SLUG_BY_LABEL as Record<string, string>)[value] ?? null;
      }
      return null;
    },
  };
}
