#!/usr/bin/env node --import tsx
/** Regenerate src/generated/place-archetype-data.ts from YAML sources. */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import {
  assertPlaceArchetype,
  assertPlaceExtent,
  assertPlaceLayerKind,
  assertPlaceMovement,
  assertPlacePolygonExtent,
  assertPlaceVertical,
  PLACE_ARCHETYPES,
} from '../src/place-archetype-assert.js';
import {
  archetypeForAxes,
  resolvePlaceAxes,
  resolvePlaceDecorations,
} from '../src/place-archetype-resolve.js';
import type {
  GeotypeLayoutMeta,
  PlaceArchetypeConfig,
  PlaceCategoryDefaults,
  PlaceLayerKind,
  PlaceSlugOverride,
} from '../src/types/place-layout.js';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresPath = path.join(pkgRoot, 'data', 'features.yml');
const rulesPath = path.join(pkgRoot, 'data', 'place-archetype-rules.yml');
const categoryDir = path.join(pkgRoot, 'data', 'category');
const generatedDir = path.join(pkgRoot, 'src', 'generated');
const outPath = path.join(generatedDir, 'place-archetype-data.ts');

type FeatureRow = {
  name?: string;
  category?: string;
  geometry_type?: string;
};

type RulesYaml = Omit<PlaceArchetypeConfig, 'categories'> & { assets: string[] };

type YamlNode = Record<string, unknown>;

function loadLayerList(value: unknown, context: string): PlaceLayerKind[] {
  if (!Array.isArray(value)) throw new Error(`${context}: layers must be a list`);
  return value.map((kind) => assertPlaceLayerKind(kind, context));
}

function loadSituationList(value: unknown, catalog: readonly string[], context: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${context}: situations must be a list`);
  return value.map((name) => {
    if (typeof name !== 'string' || !catalog.includes(name)) {
      throw new Error(`${context}: unknown situation "${String(name)}" (add it to situations: in place-archetype-rules.yml)`);
    }
    return name;
  });
}

function loadSlugOverride(node: YamlNode, catalog: readonly string[], context: string): PlaceSlugOverride {
  const override: PlaceSlugOverride = {};
  if (node.extent !== undefined) override.extent = assertPlaceExtent(node.extent, context);
  if (node.vertical !== undefined) override.vertical = assertPlaceVertical(node.vertical, context);
  if (node.movement !== undefined) override.movement = assertPlaceMovement(node.movement, context);
  if (node.situations !== undefined) override.situations = loadSituationList(node.situations, catalog, context);
  if (node.layers !== undefined) override.layers = loadLayerList(node.layers, context);
  if (Object.keys(override).length === 0) {
    throw new Error(`${context}: set at least one of extent, vertical, movement, situations, layers`);
  }
  return override;
}

function loadArchetypeLayers(raw: unknown): PlaceArchetypeConfig['archetype_layers'] {
  const node = (raw ?? {}) as YamlNode;
  for (const key of Object.keys(node)) assertPlaceArchetype(key, 'archetype_layers');
  const out = {} as PlaceArchetypeConfig['archetype_layers'];
  for (const archetype of PLACE_ARCHETYPES) {
    out[archetype] = loadLayerList(node[archetype] ?? [], `archetype_layers.${archetype}`);
  }
  return out;
}

function loadArchetypeRulesYaml(): RulesYaml {
  const raw = yaml.load(fs.readFileSync(rulesPath, 'utf8')) as unknown;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('expected place-archetype-rules.yml object');
  }
  const obj = raw as YamlNode;
  for (const key of ['archetype_defaults', 'situations', 'assets', 'slugs']) {
    if (!obj[key] || typeof obj[key] !== 'object') throw new Error(`place-archetype-rules.yml missing ${key}`);
  }
  const defaults = obj.archetype_defaults as YamlNode;
  for (const key of Object.keys(defaults)) assertPlaceArchetype(key, 'archetype_defaults');
  for (const archetype of PLACE_ARCHETYPES) {
    if (!defaults[archetype]) throw new Error(`place-archetype-rules.yml missing archetype_defaults.${archetype}`);
  }
  const situations = (obj.situations as unknown[]).map(String);
  const slugs: PlaceArchetypeConfig['slugs'] = {};
  for (const [slug, node] of Object.entries(obj.slugs as Record<string, YamlNode>)) {
    slugs[slug] = loadSlugOverride(node, situations, `place-archetype-rules.yml slugs.${slug}`);
  }
  return {
    archetype_defaults: defaults as RulesYaml['archetype_defaults'],
    archetype_layers: loadArchetypeLayers(obj.archetype_layers),
    situations,
    assets: (obj.assets as unknown[]).map(String),
    slugs,
  };
}

function loadCategoryDefaults(catalog: readonly string[]): Record<string, PlaceCategoryDefaults> {
  const out: Record<string, PlaceCategoryDefaults> = {};
  for (const file of fs.readdirSync(categoryDir).filter((f) => f.endsWith('.yml'))) {
    const data = yaml.load(fs.readFileSync(path.join(categoryDir, file), 'utf8')) as Record<string, YamlNode>;
    for (const [categoryKey, node] of Object.entries(data ?? {})) {
      if (node?.extent === undefined) continue;
      const context = `data/category/${file} → ${categoryKey}`;
      out[categoryKey] = {
        extent: assertPlacePolygonExtent(node.extent, context),
        ...(node.vertical !== undefined ? { vertical: assertPlaceVertical(node.vertical, context) } : {}),
        ...(node.situations !== undefined
          ? { situations: loadSituationList(node.situations, catalog, context) }
          : {}),
        ...(node.layers !== undefined ? { layers: loadLayerList(node.layers, context) } : {}),
      };
    }
  }
  return out;
}

function loadFeatureRows(categories: Record<string, PlaceCategoryDefaults>): Array<{
  slug: string;
  category: string;
  geometry_type: string;
}> {
  const raw = yaml.load(fs.readFileSync(featuresPath, 'utf8')) as unknown;
  if (!Array.isArray(raw)) throw new Error('expected features.yml array');
  const rows = [];
  for (const row of raw as FeatureRow[]) {
    const slug = String(row.name ?? '').trim().toLowerCase();
    if (!slug) continue;
    const category = String(row.category ?? '').trim();
    const geometry_type = String(row.geometry_type ?? '').trim().toLowerCase();
    if (!category) throw new Error(`features.yml "${slug}" missing category`);
    if (!geometry_type) throw new Error(`features.yml "${slug}" missing geometry_type`);
    if (!categories[category]) {
      throw new Error(`missing category extent for "${category}" (set extent on data/category/${category}.yml root)`);
    }
    rows.push({ slug, category, geometry_type });
  }
  return rows;
}

function main(): void {
  const { assets, ...rules } = loadArchetypeRulesYaml();
  const categories = loadCategoryDefaults(rules.situations);
  const config: PlaceArchetypeConfig = { ...rules, categories };
  const rows = loadFeatureRows(categories);

  const known = new Set(rows.map((row) => row.slug));
  const unknown = [...Object.keys(config.slugs), ...assets].filter((slug) => !known.has(slug));
  if (unknown.length > 0) {
    throw new Error(`place-archetype-rules.yml references unknown slugs: ${unknown.join(', ')}`);
  }
  const assetSlugs = new Set(assets);
  const overriddenAssets = Object.keys(config.slugs).filter((slug) => assetSlugs.has(slug));
  if (overriddenAssets.length > 0) {
    throw new Error(`place-archetype-rules.yml overrides asset slugs (not places): ${overriddenAssets.join(', ')}`);
  }

  const metaBySlug: Record<string, GeotypeLayoutMeta> = {};
  for (const { slug, category, geometry_type } of rows.filter((row) => !assetSlugs.has(row.slug))) {
    const input = { category, geometry_type };
    const axes = resolvePlaceAxes(slug, input, config);
    const archetype = archetypeForAxes(axes);
    metaBySlug[slug] = {
      ...input,
      ...axes,
      archetype,
      ...resolvePlaceDecorations(slug, input, archetype, config),
    };
  }

  fs.mkdirSync(generatedDir, { recursive: true });

  const metaLines = Object.keys(metaBySlug)
    .sort()
    .map((slug) => `  '${slug}': ${JSON.stringify(metaBySlug[slug])},`)
    .join('\n');

  const body = `/** Generated by scripts/sync-place-archetypes.ts — do not edit. */

import type { GeotypeLayoutMeta, PlaceArchetypeConfig } from '../types/place-layout.js';

export const PLACE_ARCHETYPE_CONFIG = ${JSON.stringify(config, null, 2)} as const satisfies PlaceArchetypeConfig;

export const GEOTYPE_LAYOUT_META_BY_SLUG = {
${metaLines}
} as const satisfies Record<string, GeotypeLayoutMeta>;

export type GeneratedGeotypeLayoutSlug = keyof typeof GEOTYPE_LAYOUT_META_BY_SLUG;

/** Point assets with no interior — \`assets.yaml\` kinds, not places. */
export const GEOTYPE_ASSET_SLUGS = ${JSON.stringify([...assets].sort())} as const;
`;

  fs.writeFileSync(outPath, body);

  console.log(
    `synced place archetypes → ${outPath} (${Object.keys(metaBySlug).length} places, ${assets.length} assets, ${Object.keys(categories).length} categories)`,
  );
}

main();
