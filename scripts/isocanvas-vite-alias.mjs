import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  resolveIsocanvasRoot,
  resolveIsocanvasSourceEntry,
} from './resolve-isocanvas-root.mjs';

/** @param {string} geotypesRoot */
export function resolveIsometricPackageEntry(geotypesRoot) {
  const candidates = [
    path.join(geotypesRoot, 'node_modules/@elchininet/isometric/index.js'),
  ];
  const isocanvasRoot = resolveIsocanvasRoot();
  if (isocanvasRoot) {
    candidates.push(
      path.join(isocanvasRoot, 'node_modules/@elchininet/isometric/index.js'),
    );
  }
  for (const entry of candidates) {
    if (existsSync(entry)) {
      return entry;
    }
  }
  return null;
}

/** CSS aliases must precede the TS entry alias (see isocanvas demo vite config). */
export function isocanvasViteResolveAlias(isocanvasRoot) {
  /** @type {import('vite').AliasOptions} */
  const aliases = [
    {
      find: '@westlane/isocanvas/canvas-chrome.css',
      replacement: path.join(isocanvasRoot, 'theme/canvas-chrome.css'),
    },
    {
      find: '@westlane/isocanvas/theme/schemes.css',
      replacement: path.join(isocanvasRoot, 'theme/schemes.css'),
    },
    {
      find: '@westlane/isocanvas/theme/diagram-surfaces.css',
      replacement: path.join(isocanvasRoot, 'theme/diagram-surfaces.css'),
    },
    {
      find: '@westlane/isocanvas/dot-grid.css',
      replacement: path.join(isocanvasRoot, 'theme/layout/dot-grid.css'),
    },
    {
      find: '@westlane/isocanvas/layout.css',
      replacement: path.join(isocanvasRoot, 'theme/layout/layout.css'),
    },
    {
      find: '@westlane/isocanvas/camera.css',
      replacement: path.join(isocanvasRoot, 'theme/camera/camera.css'),
    },
  ];

  const sourceEntry = resolveIsocanvasSourceEntry(isocanvasRoot);
  if (existsSync(sourceEntry)) {
    aliases.push({
      find: '@westlane/isocanvas',
      replacement: sourceEntry,
    });
  }

  return aliases;
}
