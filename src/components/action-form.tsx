'use client';
import { useState, type ReactNode } from 'react';
import { useStore } from './providers';
import { toast } from 'sonner';
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const { tx } = useStore();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={className}
      action={async (data) => {
        setBusy(true);
        try {
          await action(data);
          toast.success(tx('Изменения сохранены'));
        } catch (e) {
          toast.error(tx(e instanceof Error ? e.message : 'Не удалось сохранить'));
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>{children}</fieldset>
    </form>
  );
}
