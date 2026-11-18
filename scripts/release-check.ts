import 'dotenv/config';
import { z } from 'zod';
const local = process.argv.includes('--local');
const schema = z.object({
  DATABASE_URL: z
    .url()
    .refine((value) => /^postgres(ql)?:/.test(value), 'Use a PostgreSQL connection URL'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32)
    .refine((v) => !v.startsWith('replace-'), 'Replace placeholder secret'),
  NEXTAUTH_URL: z.url(),
  NEXT_PUBLIC_SITE_URL: z.url(),
  APP_MODE: z.enum(['demo', 'live']),
  NEXT_PUBLIC_STORE_MODE: z.enum(['demo', 'live']),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
});
const parsed = schema.safeParse(process.env);
const errors: string[] = [];
if (!parsed.success)
  errors.push(...parsed.error.issues.map((i) => String(i.path[0]) + ': ' + i.message));
else {
  const env = parsed.data;
  if (env.APP_MODE !== env.NEXT_PUBLIC_STORE_MODE)
    errors.push('APP_MODE and NEXT_PUBLIC_STORE_MODE must match');
  const db = new URL(env.DATABASE_URL),
    auth = new URL(env.NEXTAUTH_URL),
    site = new URL(env.NEXT_PUBLIC_SITE_URL);
  if (auth.origin !== site.origin)
    errors.push('NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL must share the same origin');
  const loopback = ['localhost', '127.0.0.1', '[::1]'];
  if (
    !local &&
    (auth.protocol !== 'https:' ||
      loopback.includes(auth.hostname) ||
      auth.hostname.endsWith('.example') ||
      auth.hostname === 'example.com')
  )
    errors.push('Set the real HTTPS production domain in NEXTAUTH_URL / NEXT_PUBLIC_SITE_URL');
  if (
    !loopback.includes(db.hostname) &&
    db.searchParams.get('sslmode') !== 'require' &&
    db.searchParams.get('sslmode') !== 'verify-full'
  )
    errors.push('Remote DATABASE_URL must require TLS');
  if (!local && !loopback.includes(db.hostname) && db.searchParams.get('sslaccept') !== 'strict')
    errors.push(
      'Production Prisma 6 connection requires sslaccept=strict and a trusted Supabase CA certificate',
    );
  if (env.APP_MODE === 'live') {
    if (!process.env.STORE_CONTACT_EMAIL || !process.env.STORE_CONTACT_PHONE)
      errors.push('Live mode requires STORE_CONTACT_EMAIL and STORE_CONTACT_PHONE');
  }
}
if (errors.length) {
  console.error(
    'Release configuration needs attention:\n' + errors.map((e) => '- ' + e).join('\n'),
  );
  process.exitCode = 1;
} else
  console.log(
    'Configuration valid for ' +
      (local ? 'local production verification' : parsed.data!.APP_MODE + ' production deployment') +
      '. Secrets omitted.',
  );
