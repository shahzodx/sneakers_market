import { cookies } from 'next/headers';
import type { Locale } from './dictionaries';
import { translate } from './copy';
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get('kixo.locale')?.value;
  return value === 'uz' || value === 'en' ? value : 'ru';
}
export async function getTranslator() {
  const locale = await getLocale();
  return (text: string) => translate(locale, text);
}
