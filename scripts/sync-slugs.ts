#!/usr/bin/env node --import tsx
/** Regenerate src/slugs.ts from data/venue and data/resource feature catalogs. */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadFeatureCatalog } from './feature-catalog.ts';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main(): void {
  const names = new Set<string>();
  for (const entry of loadFeatureCatalog(pkgRoot)) {
    const name = entry.feature.name;
    if (typeof name === 'string' && name.trim()) names.add(name.trim().toLowerCase());
  }

  const slugs = [...names].sort();
  const out = path.join(pkgRoot, 'src', 'slugs.ts');
  const lines = [
    '/**',
    ' * Geotypes POI slugs — synced from data/venue/features.yml and data/resource/features.yml (`name`).',
    ' * Regenerate: yarn sync:slugs',
    ' */',
    '',
    'export const GEOTYPE_SLUGS = [',
    ...slugs.map((slug) => `  '${slug}',`),
    '] as const;',
    '',
    'export type GeotypeSlug = (typeof GEOTYPE_SLUGS)[number];',
    '',
    'const SLUG_SET = new Set<string>(GEOTYPE_SLUGS);',
    '',
    'export function isKnownGeotypeSlug(slug: string): boolean {',
    '  return SLUG_SET.has(slug);',
    '}',
    '',
  ];
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`synced ${slugs.length} slugs → ${out}`);
}

main();
