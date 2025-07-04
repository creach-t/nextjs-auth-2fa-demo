import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-blue-600 dark:text-blue-400 mb-4 animate-pulse">
            404
          </div>
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Page non trouvée
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Button>
          
          <Link href="/">
            <Button className="w-full sm:w-auto flex items-center justify-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </Button>
          </Link>
        </div>

        {/* Links */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Pages populaires :
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Connexion
            </Link>
            <Link href="/register" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Inscription
            </Link>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}