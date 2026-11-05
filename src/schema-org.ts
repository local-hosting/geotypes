import { SCHEMA_ORG_TYPE_BY_SLUG } from './generated/provider-categories.js';
import { normalizeGeotypeSlug } from './normalize.js';
import { resolveGeotypeRef, type GeotypeRef } from './resolve-ref.js';

const SCHEMA_ORG_BASE = 'https://schema.org/';

function lookupSchemaOrgType(slug: string): string | null {
  const normalized = normalizeGeotypeSlug(slug);
  if (!normalized) return null;
  return (SCHEMA_ORG_TYPE_BY_SLUG as Record<string, string>)[normalized] ?? null;
}

export function schemaOrgTypeForSlug(slug: string): string | null {
  return lookupSchemaOrgType(slug);
}

export function schemaOrgUriForSlug(slug: string): string | null {
  const type = lookupSchemaOrgType(slug);
  return type ? `${SCHEMA_ORG_BASE}${type}` : null;
}

export function schemaOrgTypeForGeotypeRef(ref: GeotypeRef): string | null {
  const resolved = resolveGeotypeRef(ref);
  if (!resolved) return null;
  return lookupSchemaOrgType(resolved.slug);
}

export function schemaOrgUriForGeotypeRef(ref: GeotypeRef): string | null {
  const type = schemaOrgTypeForGeotypeRef(ref);
  return type ? `${SCHEMA_ORG_BASE}${type}` : null;
}
