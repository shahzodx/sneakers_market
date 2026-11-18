import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { assertOrigin, rateLimit } from '@/server/security';
import { failure } from '@/server/response';
function storage() {
  const {
    S3_ENDPOINT: endpoint,
    S3_REGION: region,
    S3_BUCKET: bucket,
    S3_ACCESS_KEY_ID: accessKeyId,
    S3_SECRET_ACCESS_KEY: secretAccessKey,
    S3_PUBLIC_URL: publicUrl,
  } = process.env;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrl)
    throw new Error('S3 не настроен. Заполните S3_* в .env.');
  return {
    client: new S3Client({
      endpoint,
      region: region || 'auto',
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
    publicUrl,
  };
}
export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    await requireAdmin();
    await rateLimit('upload', 20);
    const d = z
      .object({
        productId: z.string().min(1),
        name: z.string().max(200),
        type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        size: z
          .number()
          .int()
          .min(1)
          .max(5 * 1024 * 1024),
      })
      .parse(await request.json());
    await db.product.findUniqueOrThrow({ where: { id: d.productId } });
    const { client, bucket } = storage();
    const key = `products/${d.productId}/${crypto.randomUUID()}.${d.type.split('/')[1]}`;
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: d.type,
        ContentLength: d.size,
      }),
      { expiresIn: 120 },
    );
    return NextResponse.json({ key, uploadUrl });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request) {
  try {
    await assertOrigin(request);
    await requireAdmin();
    const d = z
      .object({ productId: z.string().min(1), key: z.string(), alt: z.string().max(200) })
      .parse(await request.json());
    if (!d.key.startsWith(`products/${d.productId}/`) || d.key.includes('..'))
      throw new Error('Недопустимый ключ');
    const { client, bucket, publicUrl } = storage();
    const obj = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: d.key }));
    if (
      !obj.ContentType ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(obj.ContentType) ||
      (obj.ContentLength || 0) > 5 * 1024 * 1024
    )
      throw new Error('Недопустимый файл');
    await db.productImage.create({
      data: {
        productId: d.productId,
        url: publicUrl.replace(/\/$/, '') + '/' + d.key,
        alt: d.alt,
        position: await db.productImage.count({ where: { productId: d.productId } }),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
