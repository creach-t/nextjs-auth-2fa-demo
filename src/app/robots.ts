import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/*',
        '/api/*',
        '/verify-2fa',
        '/_next/',
        '/admin/*',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}