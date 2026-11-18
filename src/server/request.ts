import { PublicError } from '@/lib/errors';
export async function readJson(request: Request, maxBytes = 32_768): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw new PublicError('Ожидается JSON-запрос', 415);
  if (Number(request.headers.get('content-length') || 0) > maxBytes)
    throw new PublicError('Запрос слишком большой', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new PublicError('Пустой запрос');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new PublicError('Запрос слишком большой', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new PublicError('Некорректный JSON');
  }
}
