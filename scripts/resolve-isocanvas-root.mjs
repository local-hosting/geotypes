import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const geotypesRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Sibling checkout: `Documents/GitHub/westlane/isocanvas` next to `local-hosting/geotypes`. */
export function resolveIsocanvasRoot() {
  const fromEnv = process.env.ISOCANVAS_ROOT?.trim();
  if (fromEnv && existsSync(path.join(fromEnv, 'package.json'))) {
    return path.resolve(fromEnv);
  }
  const sibling = path.resolve(geotypesRoot, '../../westlane/isocanvas');
  if (existsSync(path.join(sibling, 'package.json'))) {
    return sibling;
  }
  return null;
}

export function resolveIsocanvasSourceEntry(isocanvasRoot) {
  return path.join(isocanvasRoot, 'src/index.ts');
}

export function resolveIsocanvasLayoutEntry(isocanvasRoot) {
  return path.join(isocanvasRoot, 'src/layout-entry.ts');
}
