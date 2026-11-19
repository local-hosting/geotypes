import { describe, expect, it } from 'vitest';
import {
  schemaOrgTypeForGeotypeRef,
  schemaOrgTypeForSlug,
  schemaOrgUriForGeotypeRef,
  schemaOrgUriForSlug,
} from '../src/schema-org.js';
import { SCHEMA_ORG_TYPE_BY_SLUG } from '../src/generated/provider-categories.js';

describe('@local-hosting/geotypes schema.org crosswalk', () => {
  it('exports synced schema.org types for headline slugs', () => {
    expect(Object.keys(SCHEMA_ORG_TYPE_BY_SLUG).length).toBeGreaterThanOrEqual(20);
    expect(SCHEMA_ORG_TYPE_BY_SLUG.airport).toBe('Airport');
    expect(SCHEMA_ORG_TYPE_BY_SLUG.creek).toBe('BodyOfWater');
  });

  it('resolves slug and acronym refs to type and URI', () => {
    expect(schemaOrgTypeForSlug('airport')).toBe('Airport');
    expect(schemaOrgUriForSlug('airport')).toBe('https://schema.org/Airport');
    expect(schemaOrgTypeForGeotypeRef('AVA')).toBe('Airport');
    expect(schemaOrgUriForGeotypeRef('creek')).toBe('https://schema.org/BodyOfWater');
  });

  it('returns null for unmapped slugs', () => {
    expect(schemaOrgTypeForSlug('not_a_real_type')).toBeNull();
    expect(schemaOrgUriForGeotypeRef('ZZZ')).toBeNull();
  });
});
