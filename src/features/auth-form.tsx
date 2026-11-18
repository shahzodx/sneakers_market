'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '@/components/providers';
import { Button } from '@/components/ui/button';
export function AuthForm() {
  const { tx } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === 'register') {
        const r = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await r.json();
        if (!r.ok) throw new Error(json.error);
      }
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error)
        throw new Error(tx('Не удалось войти. Проверьте email и пароль или повторите позже.'));
      router.push('/account');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tx('Ошибка сети'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page container">
      <div className="auth-brand">
        <span className="eyebrow">WELCOME TO THE CLUB.</span>
        <h1>
          {tx('ТВОЙ СТИЛЬ.')}
          <br />
          <span className="stroke-text">{tx('ТВОЙ KIXO.')}</span>
        </h1>
        <p>{tx('Любимые пары и заказы — в одном месте.')}</p>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'selected' : ''}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            {tx('Вход')}
          </button>
          <button
            className={mode === 'register' ? 'selected' : ''}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            {tx('Регистрация')}
          </button>
        </div>
        <h2>{mode === 'login' ? tx('С возвращением.') : tx('Давай знакомиться.')}</h2>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              {tx('Имя')}
              <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            {tx('Пароль')}
            <input
              aria-label={tx('Пароль')}
              name="password"
              type="password"
              required
              minLength={10}
              maxLength={128}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <small>{tx('Минимум 10 символов')}</small>
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button disabled={busy}>
            {busy ? tx('Подождите…') : mode === 'login' ? tx('Войти') : tx('Создать аккаунт')}
            <ArrowUpRight size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
