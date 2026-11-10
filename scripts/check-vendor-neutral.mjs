#!/usr/bin/env node
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVendorNeutralCli } from './vn-scan-lib.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
runVendorNeutralCli(root);
