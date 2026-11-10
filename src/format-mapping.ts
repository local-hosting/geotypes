import { GEOTYPE_SLUG_BY_FORMAT_VALUE } from './generated/format-mappings.js';

/** Slug for a provider token on a geotype `mappings` key (`imdf`, `gtfs`, …). */
export function geotypeSlugForMapping(provider: string, value: string): string | undefined {
  const table = GEOTYPE_SLUG_BY_FORMAT_VALUE[provider as keyof typeof GEOTYPE_SLUG_BY_FORMAT_VALUE];
  return table?.[value as keyof typeof table];
}
