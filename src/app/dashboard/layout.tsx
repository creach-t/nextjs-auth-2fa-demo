import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Next.js Auth 2FA Demo',
  description: 'Tableau de bord sécurisé avec authentification à deux facteurs',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}