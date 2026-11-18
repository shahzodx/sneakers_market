import { readdir, unlink, cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const directory = '.next/standalone';
const entries = await readdir(directory, { withFileTypes: true });
for (const entry of entries) {
  if (
    entry.isFile() &&
    (entry.name === '.env' || entry.name.startsWith('.env.') || entry.name === 'supabase.txt')
  ) {
    await unlink(join(directory, entry.name));
    console.log('Removed private configuration from standalone output:', entry.name);
  }
}
await mkdir(join(directory, '.next'), { recursive: true });
await cp('.next/static', join(directory, '.next/static'), { recursive: true });
await cp('public', join(directory, 'public'), { recursive: true });
