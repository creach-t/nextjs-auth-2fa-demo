import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Next.js Auth 2FA Demo',
    short_name: 'Auth2FA Demo',
    description: 'Démonstration complète d\'un système d\'authentification Next.js avec authentification à deux facteurs (A2F) par email',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['business', 'productivity', 'security'],
    lang: 'fr',
    dir: 'ltr',
  }
}