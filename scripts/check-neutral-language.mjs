#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/** Opaque guard tokens (base64); not a published plain-language list. */
const ENCODED = [
  'c3BlY3RydW0=',
  'ZmllbGR3aXNl',
  'dHJ1c3RiYXNl',
  'ZG9wcGxlcg==',
  'Y29yaW8=',
  'c2hhcmVwb3J0',
  'cmFsbHk=',
  'Y2xheSBvcGVu',
  'Y2xheSB3b3Jrc3BhY2U=',
];

const DENY = ENCODED.map((s) => Buffer.from(s, 'base64').toString('utf8'));

const SKIP_DIR = new Set(['node_modules', '.git', '.yarn', 'generated', 'dist']);
const SKIP_FILES = new Set(['scripts/check-neutral-language.mjs']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (st.isFile()) out.push(path);
  }
  return out;
}

const hits = [];
for (const file of walk(root)) {
  const rel = relative(root, file);
  if (SKIP_FILES.has(rel)) continue;
  if (file.endsWith('.png') || file.endsWith('.gz')) continue;
  const lower = readFileSync(file, 'utf8').toLowerCase();
  for (let i = 0; i < DENY.length; i += 1) {
    if (lower.includes(DENY[i])) {
      hits.push(`${rel}: prohibited product reference (rule ${i + 1})`);
      break;
    }
  }
}

if (hits.length > 0) {
  console.error('check-neutral-language: failed\n' + hits.join('\n'));
  process.exit(1);
}

console.log('check-neutral-language: ok');
