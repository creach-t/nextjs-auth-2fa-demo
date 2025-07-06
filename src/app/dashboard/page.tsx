'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Shield, Clock, Activity, LogOut, Settings, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { API_ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { User as UserType } from '@/types/auth'

interface UserProfile {
  user: UserType & {
    createdAt: string
    updatedAt: string
  }
}

interface DashboardStats {
  totalLogins: number
  lastLogin: string
  account2FAEnabled: boolean
  accountCreated: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats] = useState<DashboardStats>({
    totalLogins: 1,
    lastLogin: new Date().toISOString(),
    account2FAEnabled: true,
    accountCreated: new Date().toISOString(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string>('')

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(API_ROUTES.AUTH.ME, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Échec de récupération du profil')
        }

        const result = await response.json()
        setUserProfile(result.data)
      } catch (error) {
        console.error('Profile fetch error:', error)
        setError('Erreur lors de la récupération du profil')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError('')

    try {
      const response = await fetch(API_ROUTES.AUTH.LOGOUT, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        router.push('/login')
      } else {
        throw new Error('Échec de la déconnexion')
      }
    } catch (error) {
      console.error('Logout error:', error)
      setError('Erreur lors de la déconnexion')
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement de votre dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Next.js Auth Demo
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenue{userProfile?.user.name ? `, ${userProfile.user.name}` : ''} ! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Votre compte est sécurisé avec l'authentification à deux facteurs
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Account Status */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Statut du compte
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      <span className="text-green-600">✓ Sécurisé</span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* 2FA Status */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Authentification 2FA
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      <span className="text-blue-600">✓ Activée</span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Last Login */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Dernière connexion
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      Maintenant
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Account Age */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                      Membre depuis
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {userProfile?.user.createdAt ?
                        formatDate(new Date(userProfile.user.createdAt)) :
                        'Aujourd\'hui'
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Informations du profil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom complet
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {userProfile?.user.name || 'Non spécifié'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse email
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {userProfile?.user.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date de création
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {userProfile?.user.createdAt ?
                    formatDate(new Date(userProfile.user.createdAt)) :
                    'Inconnue'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dernière mise à jour
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {userProfile?.user.updatedAt ?
                    formatDate(new Date(userProfile.user.updatedAt)) :
                    'Inconnue'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Sécurité du compte
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Authentification à deux facteurs
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      Votre compte est protégé par 2FA par email
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                  Activé
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Mot de passe sécurisé
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Hashage bcrypt avec salt
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                  Sécurisé
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Sessions sécurisées
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      JWT avec refresh token
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}