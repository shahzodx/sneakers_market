import nextEnv from '@next/env';
import { spawn } from 'node:child_process';
nextEnv.loadEnvConfig(process.cwd(), false);
const args = process.argv.slice(2);
let port = process.env.PORT || '3000',
  host = '0.0.0.0';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') port = args[++i];
  else if (args[i] === '--hostname') host = args[++i];
  else throw new Error('Unsupported start option');
}
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
  throw new Error('Invalid port');
const child = spawn(process.execPath, ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production', PORT: port, HOSTNAME: host },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => {
  console.error('Production server failed to start. Run npm run build first.');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
