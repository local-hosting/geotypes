import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import {
  isocanvasViteResolveAlias,
  resolveIsometricPackageEntry,
} from '../scripts/isocanvas-vite-alias.mjs';
import { resolveIsocanvasRoot } from '../scripts/resolve-isocanvas-root.mjs';

const vizRoot = path.dirname(fileURLToPath(import.meta.url));
const geotypesRoot = path.join(vizRoot, '..');
const isocanvasRoot = resolveIsocanvasRoot();
const isometricEntry = resolveIsometricPackageEntry(geotypesRoot);

const fsAllow = [vizRoot, geotypesRoot];
if (isocanvasRoot) {
  fsAllow.push(isocanvasRoot);
}

/** @type {import('vite').AliasOptions} */
const alias = isocanvasRoot ? isocanvasViteResolveAlias(isocanvasRoot) : [];
if (isometricEntry) {
  alias.push({
    find: '@elchininet/isometric',
    replacement: isometricEntry,
  });
}

export default defineConfig({
  root: vizRoot,
  resolve: {
    alias,
  },
  server: {
    port: 5175,
    strictPort: true,
    fs: {
      allow: fsAllow,
    },
  },
  optimizeDeps: {
    exclude: ['@westlane/isocanvas'],
  },
});
