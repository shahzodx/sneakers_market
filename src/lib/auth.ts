import { PublicError } from '@/lib/errors';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth';
import { compare } from 'bcryptjs';
import { db } from './db';
import { loginSchema } from './validation';
import { rateLimit } from '@/server/security';
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        await rateLimit('login', 12);
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !(await compare(parsed.data.password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};
export async function currentUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id
    ? db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true, role: true, phone: true },
      })
    : null;
}
export async function requireAdmin() {
  const user = await currentUser();
  if (user?.role !== 'ADMIN') throw new PublicError('Доступ запрещён', 403);
  return user;
}
