#!/usr/bin/env node --import tsx
/** Regenerate src/generated/format-mappings.ts (bridge / Twinfile format tokens → geotype slug). */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadFeatureCatalog } from './feature-catalog.ts';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(pkgRoot, 'src', 'generated', 'format-mappings.ts');

/** Keys synced by sync-provider-categories — everything else in `mappings` is a format token. */
const PROVIDER_CATEGORY_KEYS = new Set([
  'google',
  'here',
  'openstreetmap',
  'esri',
  'schemaOrg',
  'foursquare',
]);

type FeatureRow = { name?: string; mappings?: Record<string, unknown> };

function main(): void {
  const byProvider = new Map<string, Map<string, string>>();

  for (const entry of loadFeatureCatalog(pkgRoot)) {
    const row = entry.feature as FeatureRow;
    const slug = typeof row.name === 'string' ? row.name.trim().toLowerCase() : '';
    const mappings = row.mappings ?? {};
    if (!slug) continue;
    for (const [provider, value] of Object.entries(mappings)) {
      if (PROVIDER_CATEGORY_KEYS.has(provider)) continue;
      if (typeof value !== 'string' || !value.trim() || value === 'null') continue;
      const table = byProvider.get(provider) ?? new Map<string, string>();
      // Later catalog rows win (gtfs: station is shared; train_station is last).
      table.set(value, slug);
      byProvider.set(provider, table);
    }
  }

  const providers = [...byProvider.keys()].sort();
  const bodyLines: string[] = [];
  for (const provider of providers) {
    const table = byProvider.get(provider)!;
    const tokens = [...table.keys()].sort();
    bodyLines.push(`  ${JSON.stringify(provider)}: {`);
    for (const token of tokens) {
      bodyLines.push(`    ${JSON.stringify(token)}: ${JSON.stringify(table.get(token))},`);
    }
    bodyLines.push('  },');
  }

  const lines = [
    '/**',
    ' * Format mapping tokens → geotype slug — synced from data/venue and data/resource feature catalogs',
    ' * Regenerate: yarn sync:format-mappings',
    ' */',
    '',
    'export const GEOTYPE_SLUG_BY_FORMAT_VALUE = {',
    ...bodyLines,
    '} as const satisfies Record<string, Record<string, string>>;',
    '',
  ];

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
  let tokenCount = 0;
  for (const table of byProvider.values()) tokenCount += table.size;
  console.log(`synced format mappings → ${outPath} (providers=${providers.length}, tokens=${tokenCount})`);
}

main();
