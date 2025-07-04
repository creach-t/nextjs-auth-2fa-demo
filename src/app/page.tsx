import Link from 'next/link'
import { ArrowRight, Shield, Lock, Mail } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Next.js Auth
              <span className="text-blue-600 dark:text-blue-400"> 2FA Demo</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Démonstration complète d'un système d'authentification sécurisé avec authentification à deux facteurs par email
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Sécurité Avancée</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Hashage bcrypt, validation Zod, protection CSRF et rate limiting
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Lock className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Authentification 2FA</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Codes à 6 chiffres par email avec expiration automatique
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Interface Moderne</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Design responsive avec Tailwind CSS et animations fluides
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors group"
            >
              Se connecter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Créer un compte
            </Link>
          </div>

          {/* Tech Stack */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Construit avec</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">Next.js 14</span>
              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">TypeScript</span>
              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">Tailwind CSS</span>
              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">Prisma</span>
              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">JWT</span>
              <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">Nodemailer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}