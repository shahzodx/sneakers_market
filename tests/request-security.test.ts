import { describe, it, expect } from 'vitest';
import { readJson } from '../src/server/request';
import { failure } from '../src/server/response';
import { PublicError } from '../src/lib/errors';
import { assertOrigin } from '../src/server/security';
describe('request boundaries', () => {
  it('accepts JSON and rejects other content types', async () => {
    expect(
      await readJson(
        new Request('https://example.test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"x":1}',
        }),
      ),
    ).toEqual({ x: 1 });
    await expect(
      readJson(new Request('https://example.test', { method: 'POST', body: 'hello' })),
    ).rejects.toMatchObject({ status: 415 });
  });
  it('limits actual bytes even without Content-Length', async () => {
    await expect(
      readJson(
        new Request('https://example.test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: 'x'.repeat(100) }),
        }),
        32,
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it('does not echo malformed JSON or internal messages', async () => {
    await expect(
      readJson(
        new Request('https://example.test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"secret":"private-password",oops',
        }),
      ),
    ).rejects.toThrow('Некорректный JSON');
    const response = failure(new Error('postgresql://user:private-password@host/db'));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('private-password');
  });
  it('preserves intentional error status', () => {
    expect(failure(new PublicError('denied', 403)).status).toBe(403);
    expect(failure(new PublicError('retry', 429)).headers.get('Retry-After')).toBe('60');
  });
  it('rejects missing/foreign Origin and permits configured origin', async () => {
    await expect(
      assertOrigin(
        new Request('http://localhost:3100/api/orders', {
          headers: { Origin: 'https://attacker.test' },
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      assertOrigin(new Request('http://localhost:3100/api/orders')),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      assertOrigin(
        new Request('http://localhost:3100/api/orders', {
          headers: { Origin: 'http://localhost:3100' },
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
