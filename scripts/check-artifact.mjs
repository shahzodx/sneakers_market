import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'dotenv';
const values = { ...process.env };
for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  try {
    Object.assign(values, parse(await readFile(name)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
const secrets = Object.entries(values)
  .filter(
    ([key, value]) =>
      !key.startsWith('NEXT_PUBLIC_') &&
      /SECRET|TOKEN|PASSWORD|DATABASE_URL/.test(key) &&
      typeof value === 'string' &&
      value.length >= 12,
  )
  .map(([, value]) => value);
if (values.DATABASE_URL) {
  try {
    const password = decodeURIComponent(new URL(values.DATABASE_URL).password);
    if (password.length >= 12) secrets.push(password);
  } catch {}
}
let scanned = 0;
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && /\.(js|json|html|txt)$/.test(entry.name)) {
      const content = await readFile(path, 'utf8');
      scanned++;
      if (secrets.some((secret) => content.includes(secret)))
        throw new Error('Private configuration found in build artifact: ' + path);
    }
  }
}
await walk('.next/static');
await walk('.next/standalone');
console.log(`Artifact secret scan passed (${scanned} text files).`);
