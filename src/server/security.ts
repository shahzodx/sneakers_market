import { headers } from 'next/headers';
import { db } from '@/lib/db';
export async function assertOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin;
  if (!origin || origin !== expected) throw new Error('Недопустимый источник запроса');
}
export async function rateLimit(scope: string, limit = 10, windowMs = 60000) {
  const h = await headers();
  // Use the direct peer's trusted reverse-proxy header only when explicitly configured.
  const ip =
    process.env.TRUST_PROXY === 'true'
      ? h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      : 'local';
  const key = `${scope}:${ip}`;
  const now = new Date();
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key","count","resetAt") VALUES (${key},1,${new Date(now.getTime() + windowMs)}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count"+1 END, "resetAt"=CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${new Date(now.getTime() + windowMs)} ELSE "RateLimit"."resetAt" END RETURNING "count"`;
  if (rows[0].count > limit) throw new Error('Слишком много запросов. Попробуйте через минуту.');
}
