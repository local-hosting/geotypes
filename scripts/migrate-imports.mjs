#!/usr/bin/env node
/**
 * Mechanical import/registry migration for @local-hosting/geotypes (dry-run unless --write).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.argv[2]
const WRITE = process.argv.includes('--write')
if (!ROOT) {
  console.error('usage: migrate-imports.mjs <repo-root> [--write]')
  process.exit(1)
}

const REPLACEMENTS = [
  ['@local-hosting/geotypes', '@local-hosting/geotypes'],
  ['@twinfile/geotypes', '@local-hosting/geotypes'],
  ['twinfile/geotypes', 'local-hosting/geotypes'],
]

const SKIP = new Set(['node_modules', 'dist', '.git', 'yarn.lock'])

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) walk(path, files)
    else if (/\.(ts|tsx|js|mjs|json|md|yaml|yml)$/.test(name)) files.push(path)
  }
  return files
}

let changed = 0
for (const file of walk(ROOT)) {
  let text = readFileSync(file, 'utf8')
  let next = text
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to)
  }
  if (next !== text) {
    changed += 1
    if (WRITE) writeFileSync(file, next)
    console.log(WRITE ? 'wrote' : 'would update', file)
  }
}
console.log(`${WRITE ? 'Updated' : 'Would update'} ${changed} files`)