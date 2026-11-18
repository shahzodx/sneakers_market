import { AuthForm } from '@/features/auth-form';
export const metadata = { title: 'Вход', robots: { index: false, follow: false } };
export default function Page() {
  return <AuthForm />;
}
