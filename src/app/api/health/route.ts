import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
// Only public infrastructure status is cached, never user-specific data.
let probe: Promise<boolean> | undefined;
let cached: { up: boolean; until: number } | undefined;
function databaseReady() {
  if (cached && cached.until > Date.now()) return Promise.resolve(cached.up);
  if (!probe)
    probe = (async () => {
      let up = false;
      try {
        await db.$queryRaw`SELECT 1`;
        up = true;
      } catch {}
      cached = { up, until: Date.now() + 5000 };
      probe = undefined;
      return up;
    })();
  return probe;
}
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('ready') === '1' && !(await databaseReady()))
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  return NextResponse.json(
    { status: 'ok', service: 'kixo' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
