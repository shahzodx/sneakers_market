import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
const inter = localFont({
  src: '../../public/fonts/InterVariable.woff2',
  display: 'swap',
  variable: '--font-inter',
});
import { cookies } from 'next/headers';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type { Locale } from '@/i18n/dictionaries';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'KIXO — Твой ритм. Твои правила.', template: '%s | KIXO' },
  description:
    'Кроссовки с характером. Nike, Adidas, New Balance, Asics и Puma. Доставка по Узбекистану.',
  openGraph: {
    title: 'KIXO — Always in motion',
    description: 'Найди пару, которая говорит за тебя.',
    locale: 'ru_RU',
    type: 'website',
    images: ['/images/sneaker-white.jpg'],
  },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FAFAF8' };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const value = (await cookies()).get('kixo.locale')?.value;
  const locale: Locale = value === 'uz' || value === 'en' ? value : 'ru';
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={inter.variable}>
        <Providers initialLocale={locale}>
          <a className="skip-link" href="#main">
            К содержимому
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
