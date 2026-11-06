import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';

import type { GeotypeKind } from '../src/types/place-layout.ts';

export const GEOTYPE_KINDS = ['venue', 'resource'] as const satisfies readonly GeotypeKind[];

export type CatalogEntry = {
  kind: GeotypeKind;
  sourcePath: string;
  feature: Record<string, unknown>;
};

/** `data/venue/features.yml` and `data/resource/features.yml`. */
export function featureCatalogPaths(pkgRoot: string): Array<{ kind: GeotypeKind; path: string }> {
  return GEOTYPE_KINDS.map((kind) => ({
    kind,
    path: path.join(pkgRoot, 'data', kind, 'features.yml'),
  }));
}

/** Both catalogs, in venue then resource order. Fails if a slug is listed twice. */
export function loadFeatureCatalog(pkgRoot: string): CatalogEntry[] {
  const rows: CatalogEntry[] = [];
  const seen = new Set<string>();
  for (const file of featureCatalogPaths(pkgRoot)) {
    if (!fs.existsSync(file.path)) throw new Error(`missing ${file.path}`);
    const raw = yaml.load(fs.readFileSync(file.path, 'utf8'));
    if (!Array.isArray(raw)) throw new Error(`expected a feature array in ${file.path}`);
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const name = String((entry as { name?: unknown }).name ?? '').trim().toLowerCase();
      if (!name) continue;
      if (seen.has(name)) throw new Error(`geotype "${name}" is listed in both venue and resource catalogs`);
      seen.add(name);
      rows.push({ kind: file.kind, sourcePath: file.path, feature: entry as Record<string, unknown> });
    }
  }
  return rows;
}
