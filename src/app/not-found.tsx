import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <div className="container empty-state">
      <span className="eyebrow">404 / OFF THE TRACK</span>
      <h1>Эта пара ушла вперёд.</h1>
      <p>Страница не найдена или недоступна.</p>
      <Button asChild>
        <Link href="/catalog">Найти свою пару ↗</Link>
      </Button>
    </div>
  );
}
