import { z } from 'zod';
export const imageUrlSchema = z
  .string()
  .max(2000)
  .refine((value) => {
    if (/^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return true;
    try {
      const url = new URL(value);
      const allowed = [
        'images.unsplash.com',
        ...(process.env.S3_PUBLIC_URL ? [new URL(process.env.S3_PUBLIC_URL).hostname] : []),
      ];
      return url.protocol === 'https:' && allowed.includes(url.hostname);
    } catch {
      return false;
    }
  }, 'Используйте /images/… или HTTPS URL из настроенного S3 / Unsplash');
