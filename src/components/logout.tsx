'use client';
import { useStore } from './providers';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
export function Logout() {
  const { tx } = useStore();
  return (
    <button className="text-link" onClick={() => signOut({ callbackUrl: '/' })}>
      {tx('Выйти')} <LogOut size={16} />
    </button>
  );
}
