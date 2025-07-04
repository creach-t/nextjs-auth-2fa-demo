import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-8xl font-bold text-blue-600 dark:text-blue-400 opacity-20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg">
                <Search className="w-12 h-12 text-gray-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page non trouvée
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Désolé, nous ne pouvons pas trouver la page que vous cherchez. 
            Elle a peut-être été déplacée, supprimée ou n'existe pas.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              asChild
              className="w-full"
            >
              <Link href="/" className="flex items-center justify-center space-x-2">
                <Home className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="w-full"
              onClick={() => window.history.back()}
            >
              <button className="flex items-center justify-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Page précédente</span>
              </button>
            </Button>
          </div>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Liens utiles :</p>
          <div className="flex justify-center space-x-4 mt-2">
            <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400">
              Inscription
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}