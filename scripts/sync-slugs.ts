#!/usr/bin/env node --import tsx
/** Regenerate src/slugs.ts from in-repo data/features.yml */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresPath = path.join(pkgRoot, 'data', 'features.yml');

function main(): void {
  if (!fs.existsSync(featuresPath)) {
    throw new Error(`missing ${featuresPath}`);
  }
  const raw = yaml.load(fs.readFileSync(featuresPath, 'utf8')) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error('expected features.yml array');
  }

  const names = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = (entry as { name?: string }).name;
    if (typeof name === 'string' && name.trim()) {
      names.add(name.trim().toLowerCase());
    }
  }

  const slugs = [...names].sort();
  const out = path.join(pkgRoot, 'src', 'slugs.ts');
  const lines = [
    '/**',
    ' * Geotypes POI slugs — synced from data/features.yml (`name` field).',
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
