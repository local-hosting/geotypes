#!/usr/bin/env ts-node
import { Command } from 'commander';
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { geometryRecommend } from './commands/geometry-recommend';
import { mapSchema } from './commands/map-schema';

const program = new Command();

function runProtoc(protoFiles: string[], outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const args = [
      '--proto_path=proto',
      '--plugin=protoc-gen-es=./node_modules/.bin/protoc-gen-es',
      `--es_out=${outputDir}`,
      ...protoFiles.map(f => f.replace('proto/', '')),
    ];
    const proc = spawn('protoc', args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`protoc failed with exit code ${code}`));
    });
    proc.on('error', reject);
  });
}

program
  .name("proto")
  .description("Protocol buffer and schema management commands")
  .version("1.0.0");

program
  .command('generate')
  .description('Generate TypeScript from proto files')
  .action(async () => {
    try {
      await runProtoc(['proto/geospatial.proto', 'proto/tags.proto'], 'generated');
      console.log('✅ Protobuf TypeScript generation complete');
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

program
  .command("geometry")
  .description("Recommend geometry types for features (optionally --apply to update, --json to save report)")
  .option("-f, --file <path>", "Unused. Catalogs are data/venue/features.yml and data/resource/features.yml")
  .option("-t, --threshold <number>", "Confidence threshold for auto-update", "0.8")
  .option("--no-update", "Don't update the file, just show recommendations")
  .option("--json", "Write detailed recommendations to geometry_recommendations.json")
  .action(async (options) => {
    try {
      await geometryRecommend(options);
    } catch (error) {
      console.error("Error recommending geometry:", error);
      process.exit(1);
    }
  });

program
  .command('map-schema')
  .description('Map schema/all_features.yml entries to Foursquare-aligned taxonomy using AI')
  .option('-t, --threshold <value>', 'Similarity threshold for a match', '0.7')
  .action(async (options) => {
    try {
      await mapSchema(options);
    } catch (error) {
      console.error('Error mapping schema:', error);
      process.exit(1);
    }
  });

program
  .command('test-short-ids')
  .description('Test the short ID generator')
  .action(async () => {
    console.log('🧪 Testing short ID generator...');
    execSync('npx tsx cli/commands/test-short-ids.ts', { stdio: 'inherit' });
  });

program.parse(process.argv); 