'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from './ui/button';
export function ImageUpload({ productId }: { productId: string }) {
  const [busy, setBusy] = useState(false),
    router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const file = new FormData(e.currentTarget).get('file') as File;
        if (!file?.size) return;
        setBusy(true);
        try {
          const r = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, name: file.name, type: file.type, size: file.size }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          const upload = await fetch(d.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          if (!upload.ok) throw new Error('Не удалось загрузить файл');
          const confirm = await fetch('/api/admin/upload', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, key: d.key, alt: file.name }),
          });
          if (!confirm.ok) throw new Error('Не удалось сохранить изображение');
          toast.success('Изображение загружено');
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Ошибка загрузки');
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Загрузка в S3
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required />
      </label>
      <Button disabled={busy} variant="outline" size="sm">
        {busy ? 'Загрузка…' : 'Загрузить изображение'}
      </Button>
    </form>
  );
}
