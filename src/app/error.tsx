'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container empty-state">
      <h1>Не удалось загрузить страницу</h1>
      <p>
        Проверьте подключение и повторите попытку. Если проблема остаётся, убедитесь, что PostgreSQL
        запущен.
      </p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
