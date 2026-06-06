#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const REQUIRED_FIELDS = ['id', 'name', 'geometry_type'];

function checkFeature(feature: any): string[] {
  const problems: string[] = [];
  if (!feature || typeof feature !== 'object') {
    problems.push('Entry is not an object or is empty');
    return problems;
  }
  for (const field of REQUIRED_FIELDS) {
    if (!feature[field]) {
      problems.push(`Missing required field: ${field}`);
    }
  }
  return problems;
}

function main() {
  const schemaDir = path.join(process.cwd(), 'data', 'schema');
  const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.yml'));
  let foundProblems = false;

  for (const file of schemaFiles) {
    const filePath = path.join(schemaDir, file);
    let features: any[] = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      features = yaml.load(content) as any[];
    } catch (e) {
      console.error(`Error loading ${file}:`, e);
      continue;
    }
    if (!Array.isArray(features)) {
      console.warn(`File ${file} does not contain a top-level YAML list.`);
      continue;
    }
    features.forEach((feature, idx) => {
      const problems = checkFeature(feature);
      if (problems.length > 0) {
        foundProblems = true;
        console.log(`\n❗ Problem in ${file} [entry #${idx + 1}]:`);
        problems.forEach(p => console.log(`  - ${p}`));
        if (feature && typeof feature === 'object') {
          console.log('  Entry:', JSON.stringify(feature, null, 2));
        } else {
          console.log('  Entry:', feature);
        }
      }
    });
  }
  if (!foundProblems) {
    console.log('✅ No malformed or incomplete features found!');
  }
}

main(); 