'use client'

import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { API_ROUTES } from '@/lib/constants'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import type { AuthResponse } from '@/types/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: AuthResponse = await response.json()

      if (!result.success) {
        setError(result.message)
        return
      }

      if (result.data?.requires2FA) {
        // Redirect to 2FA verification
        setSuccess('Code de vérification envoyé ! Vérifiez votre email.')
        setTimeout(() => {
          router.push(`/verify-2fa?email=${encodeURIComponent(data.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
        }, 1500)
      } else {
        // Direct login success
        setSuccess('Connexion réussie ! Redirection...')
        setTimeout(() => {
          router.push(callbackUrl)
        }, 1000)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connexion
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertIcon variant="destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert variant="success" className="mb-6">
            <AlertIcon variant="success" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Adresse email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@exemple.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Mot de passe
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Entrez votre mot de passe"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Se souvenir de moi
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}