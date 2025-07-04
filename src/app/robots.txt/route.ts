export function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /verify-2fa/

Sitemap: ${process.env.NEXTAUTH_URL || 'https://nextjs-auth-2fa-demo.vercel.app'}/sitemap.xml`

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}