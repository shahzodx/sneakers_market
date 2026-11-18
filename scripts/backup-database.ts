import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { openSync, closeSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const output = process.argv[2];
if (!output || !output.endsWith('.dump'))
  throw new Error('Usage: npm run db:backup -- artifacts/private-backup.dump');
const url = new URL(process.env.DATABASE_URL || '');
const file = resolve(output);
mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
const fd = openSync(file, 'wx', 0o600);
try {
  const result = spawnSync(
    'pg_dump',
    ['--format=custom', '--schema=public', '--no-owner', '--no-acl'],
    {
      stdio: ['ignore', fd, 'pipe'],
      env: {
        ...process.env,
        PGHOST: url.hostname,
        PGPORT: url.port || '5432',
        PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
        PGUSER: decodeURIComponent(url.username),
        PGPASSWORD: decodeURIComponent(url.password),
        PGSSLMODE: url.searchParams.get('sslmode') || 'prefer',
        PGCONNECT_TIMEOUT: '15',
      },
    },
  );
  if (result.status !== 0) {
    unlinkSync(file);
    console.error(
      'Backup failed. Verify pg_dump availability/version and database access. Provider details omitted.',
    );
    process.exitCode = 1;
  } else console.log('Private public-schema backup created:', file);
} finally {
  closeSync(fd);
}
