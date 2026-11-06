#!/usr/bin/env node --import tsx
/** Regenerate src/generated/acronyms.ts from the venue and resource feature catalogs. */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadFeatureCatalog } from './feature-catalog.ts';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(pkgRoot, 'src', 'generated', 'acronyms.ts');

type FeatureRow = { id?: string; name?: string };

function main(): void {
  const byAcronym: Record<string, string> = {};
  const bySlug: Record<string, string> = {};

  for (const entry of loadFeatureCatalog(pkgRoot)) {
    const row = entry.feature as FeatureRow;
    const acronym = typeof row.id === 'string' ? row.id.trim().toUpperCase() : '';
    const slug = typeof row.name === 'string' ? row.name.trim().toLowerCase() : '';
    if (!acronym || !slug) continue;
    byAcronym[acronym] = slug;
    bySlug[slug] = acronym;
  }

  const acronyms = Object.keys(byAcronym).sort();
  const lines = [
    '/**',
    ' * Geotype acronyms — synced from data/venue and data/resource feature catalogs (`id` + `name`).',
    ' * Regenerate: yarn sync:acronyms',
    ' */',
    '',
    'export const GEOTYPE_BY_ACRONYM = {',
    ...acronyms.map((acronym) => `  '${acronym}': '${byAcronym[acronym]}',`),
    '} as const;',
    '',
    'export type GeotypeAcronym = keyof typeof GEOTYPE_BY_ACRONYM;',
    '',
    'export const GEOTYPE_ACRONYM_BY_SLUG = {',
    ...Object.keys(bySlug).sort().map((slug) => `  '${slug}': '${bySlug[slug]}',`),
    '} as const;',
    '',
    'const ACRONYM_SET = new Set<string>(Object.keys(GEOTYPE_BY_ACRONYM));',
    '',
    'export function isKnownGeotypeAcronym(value: string): boolean {',
    '  return ACRONYM_SET.has(value.trim().toUpperCase());',
    '}',
    '',
    'export function acronymToSlug(acronym: string): string | null {',
    '  const key = acronym.trim().toUpperCase();',
    '  return (GEOTYPE_BY_ACRONYM as Record<string, string>)[key] ?? null;',
    '}',
    '',
    'export function slugToAcronym(slug: string): string | null {',
    '  return (GEOTYPE_ACRONYM_BY_SLUG as Record<string, string>)[slug] ?? null;',
    '}',
    '',
  ];
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`synced ${acronyms.length} acronyms → ${outPath}`);
}

main();
