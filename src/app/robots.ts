import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.NEXT_PUBLIC_STORE_MODE !== 'live'
        ? { userAgent: '*', disallow: '/' }
        : {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/account', '/checkout', '/order/', '/api/', '/cart', '/login'],
          },
    sitemap: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/sitemap.xml',
  };
}
