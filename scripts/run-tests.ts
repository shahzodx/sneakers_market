import { spawnSync } from 'node:child_process';
import { loadTestEnvironment } from './test-environment';
loadTestEnvironment();
const mode = process.argv[2] || 'unit';
const commands: Record<string, string[]> = {
  unit: ['vitest', 'run'],
  e2e: ['playwright', 'test'],
  migrate: ['prisma', 'migrate', 'deploy'],
  seed: ['tsx', 'prisma/seed.ts'],
};
if (!commands[mode]) throw new Error('Unknown test command');
const [tool, ...args] = commands[mode];
const result = spawnSync(`node_modules/.bin/${tool}`, [...args, ...process.argv.slice(3)], {
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
