import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const backup = process.argv[2];
const url = new URL(process.env.RESTORE_DATABASE_URL || '');
if (
  !backup ||
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !url.pathname.endsWith('_restore_test')
)
  throw new Error(
    'Restore verification requires RESTORE_DATABASE_URL pointing to an empty LOCAL *_restore_test database.',
  );
const env = {
  ...process.env,
  PGHOST: url.hostname,
  PGPORT: url.port || '5432',
  PGDATABASE: url.pathname.slice(1),
  PGUSER: decodeURIComponent(url.username),
  PGPASSWORD: decodeURIComponent(url.password),
  PGSSLMODE: 'prefer',
};
function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0)
    throw new Error(
      command + ' failed during isolated restore verification. Provider details omitted.',
    );
  return result.stdout;
}
const existing = run('psql', [
  '-X',
  '-At',
  '-v',
  'ON_ERROR_STOP=1',
  '-c',
  "SELECT count(*) FROM pg_tables WHERE schemaname='public'",
]).trim();
if (existing !== '0')
  throw new Error('Restore target must have no tables. Existing databases are never erased.');
const directory = mkdtempSync(join(tmpdir(), 'kixo-restore-'));
const schema = join(directory, 'pre-data.sql');
try {
  run('pg_restore', [
    '--section=pre-data',
    '--no-owner',
    '--no-acl',
    '--file=' + schema,
    resolve(backup),
  ]);
  // pg_attver is provider-internal column metadata, unsupported by community PostgreSQL.
  // Remove only these exact metadata statements; retain application schema and constraints.
  const sql = readFileSync(schema, 'utf8')
    .split('\n')
    .filter((line) => !/^ALTER TABLE ONLY .+ ALTER COLUMN .+ SET \(pg_attver=\d+\);$/.test(line))
    .map((line) =>
      line === 'CREATE SCHEMA public;' ? 'CREATE SCHEMA IF NOT EXISTS public;' : line,
    )
    .join('\n');
  writeFileSync(schema, sql, { mode: 0o600 });
  run('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-f', schema]);
  for (const section of ['data', 'post-data'])
    run('pg_restore', [
      '--section=' + section,
      '--no-owner',
      '--no-acl',
      '--exit-on-error',
      '--dbname=' + url.pathname.slice(1),
      resolve(backup),
    ]);
  console.log('Isolated backup restore passed.');
  console.log(
    run('psql', [
      '-X',
      '-At',
      '-c',
      'SELECT count(*) AS products FROM "Product"; SELECT count(*) AS variants FROM "ProductVariant";',
    ]).trim(),
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
