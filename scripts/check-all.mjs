#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const geotypesRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('yarn', ['check'], { cwd: geotypesRoot, stdio: 'inherit' });
process.exit(result.status ?? 1);
