#!/usr/bin/env node --import tsx
/** Regenerate src/generated/provider-categories.ts */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { loadFeatureCatalog } from './feature-catalog.ts';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaOrgPath = path.join(pkgRoot, 'data', 'schema-org-by-slug.yml');
const categoryDir = path.join(pkgRoot, 'data', 'category');
const outPath = path.join(pkgRoot, 'src', 'generated', 'provider-categories.ts');

const SCHEMA_ORG_TYPE_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

type FeatureRow = { name?: string; mappings?: Record<string, unknown> };
type CategoryNode = { id?: string; subcategories?: Record<string, CategoryNode> };

function isFoursquareId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value);
}

function walkCategory(key: string, node: CategoryNode, fsqBySlug: Map<string, string>): void {
  if (isFoursquareId(node.id)) fsqBySlug.set(key, node.id);
  if (node.subcategories) {
    for (const [subKey, subNode] of Object.entries(node.subcategories)) {
      walkCategory(subKey, subNode, fsqBySlug);
    }
  }
}

function mapLines(name: string, data: Record<string, string>): string[] {
  const keys = Object.keys(data).sort();
  return [
    `export const ${name} = {`,
    ...keys.map((k) => `  '${k}': '${data[k]}',`),
    '} as const;',
    '',
  ];
}

function invertMap(data: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slug, value] of Object.entries(data)) out[value] = slug;
  return out;
}

function loadSchemaOrgBySlug(): Record<string, string> {
  const raw = yaml.load(fs.readFileSync(schemaOrgPath, 'utf8')) as unknown;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('expected schema-org-by-slug.yml object');
  }
  const out: Record<string, string> = {};
  for (const [slug, typeName] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof typeName !== 'string' || !typeName.trim()) continue;
    const normalizedSlug = slug.trim().toLowerCase();
    const type = typeName.trim();
    if (!SCHEMA_ORG_TYPE_PATTERN.test(type)) {
      throw new Error(`invalid schema.org type "${type}" for slug ${normalizedSlug}`);
    }
    out[normalizedSlug] = type;
  }
  return out;
}

function assertSchemaOrgType(type: string, slug: string): string {
  const trimmed = type.trim();
  if (!trimmed || trimmed === 'null') return '';
  if (!SCHEMA_ORG_TYPE_PATTERN.test(trimmed)) {
    throw new Error(`invalid schema.org type "${trimmed}" for slug ${slug}`);
  }
  return trimmed;
}

function main(): void {
  const googleBySlug: Record<string, string> = {};
  const hereBySlug: Record<string, string> = {};
  const osmBySlug: Record<string, string> = {};
  const esriBySlug: Record<string, string> = {};
  const schemaOrgBySlug = loadSchemaOrgBySlug();

  for (const entry of loadFeatureCatalog(pkgRoot)) {
    const row = entry.feature as FeatureRow;
    const slug = typeof row.name === 'string' ? row.name.trim().toLowerCase() : '';
    if (!slug) continue;
    const mappings = row.mappings ?? {};
    const google = mappings.google;
    const here = mappings.here;
    const osm = mappings.openstreetmap;
    const esri = mappings.esri;
    if (typeof google === 'string' && google.trim() && google !== 'null') {
      googleBySlug[slug] = google.trim();
    }
    if (typeof here === 'string' && here.trim() && here !== 'null') {
      hereBySlug[slug] = here.trim();
    }
    if (typeof osm === 'string' && osm.trim() && osm !== 'null') {
      osmBySlug[slug] = osm.trim();
    }
    if (typeof esri === 'string' && esri.trim() && esri !== 'null') {
      esriBySlug[slug] = esri.trim();
    }
    const schemaOrg = mappings.schemaOrg;
    if (typeof schemaOrg === 'string') {
      const type = assertSchemaOrgType(schemaOrg, slug);
      if (type) schemaOrgBySlug[slug] = type;
    }
  }

  const fsqBySlug = new Map<string, string>();
  for (const file of fs.readdirSync(categoryDir).filter((f) => f.endsWith('.yml'))) {
    const data = yaml.load(fs.readFileSync(path.join(categoryDir, file), 'utf8')) as Record<
      string,
      CategoryNode
    >;
    for (const [topKey, topNode] of Object.entries(data ?? {})) {
      walkCategory(topKey, topNode, fsqBySlug);
    }
  }

  const fsqObj = Object.fromEntries(fsqBySlug.entries());
  const fsqById = invertMap(fsqObj);
  const googleByType = invertMap(googleBySlug);
  const esriByLabel = invertMap(esriBySlug);
  const esriCategoryIdBySlug: Record<string, string> = {};
  for (const [slug, label] of Object.entries(esriBySlug)) {
    const fsqId = fsqObj[slug];
    if (fsqId) esriCategoryIdBySlug[slug] = fsqId;
    void label;
  }

  const lines = [
    '/**',
    ' * Provider category crosswalks — synced from data/venue and data/resource feature catalogs, schema-org-by-slug.yml, data/category/*.yml',
    ' * Regenerate: yarn sync:providers',
    ' */',
    '',
    ...mapLines('FSQ_CATEGORY_ID_BY_SLUG', fsqObj),
    ...mapLines('FSQ_SLUG_BY_CATEGORY_ID', fsqById),
    ...mapLines('GOOGLE_TYPE_BY_SLUG', googleBySlug),
    ...mapLines('GOOGLE_SLUG_BY_TYPE', googleByType),
    ...mapLines('HERE_CODE_BY_SLUG', hereBySlug),
    ...mapLines('OSM_TAG_BY_SLUG', osmBySlug),
    ...mapLines('ESRI_LABEL_BY_SLUG', esriBySlug),
    ...mapLines('ESRI_SLUG_BY_LABEL', esriByLabel),
    ...mapLines('ESRI_CATEGORY_ID_BY_SLUG', esriCategoryIdBySlug),
    ...mapLines('SCHEMA_ORG_TYPE_BY_SLUG', schemaOrgBySlug),
  ];

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(
    `synced providers → ${outPath} (fsq=${Object.keys(fsqObj).length}, google=${Object.keys(googleBySlug).length}, esri=${Object.keys(esriBySlug).length}, schema.org=${Object.keys(schemaOrgBySlug).length})`
  );
}

main();
