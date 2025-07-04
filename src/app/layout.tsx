import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next.js Auth 2FA Demo',
  description: 'Démonstration complète d\'un système d\'authentification Next.js avec authentification à deux facteurs (A2F) par email',
  keywords: ['Next.js', 'Authentication', '2FA', 'TypeScript', 'Security'],
  authors: [{ name: 'Next.js Auth Demo' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}