import nextEnv from '@next/env';
import { spawnSync } from 'node:child_process';
nextEnv.loadEnvConfig(process.cwd(), false);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured before migration');
const result = spawnSync('node_modules/.bin/prisma', ['migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
});
process.exitCode = result.status ?? 1;
