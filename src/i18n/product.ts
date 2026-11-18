import type { Product } from '@/types/product';
import type { Locale } from './dictionaries';
export function localizeProduct(product: Product, locale: Locale) {
  const translation = product.translations.find((t) => t.locale === locale);
  return translation
    ? {
        ...product,
        name: translation.name,
        description: translation.description,
        material: translation.material,
      }
    : product;
}
