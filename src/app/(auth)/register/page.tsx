'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, UserPlus, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { API_ROUTES } from '@/lib/constants'
import type { AuthResponse } from '@/types/auth'

export default function RegisterPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(API_ROUTES.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          name: data.name,
        }),
      })

      const result: AuthResponse = await response.json()

      if (!result.success) {
        setError(result.message)
        return
      }

      setSuccess('Compte créé avec succès ! Redirection vers la connexion...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }

    let strength = 0
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^\w\s]/.test(password),
    ]

    strength = checks.filter(Boolean).length

    const levels = [
      { label: 'Très faible', color: 'bg-red-500' },
      { label: 'Faible', color: 'bg-red-400' },
      { label: 'Moyen', color: 'bg-yellow-500' },
      { label: 'Fort', color: 'bg-green-500' },
      { label: 'Très fort', color: 'bg-green-600' },
    ]

    return {
      strength,
      label: levels[strength - 1]?.label || '',
      color: levels[strength - 1]?.color || '',
    }
  }

  const passwordStrength = getPasswordStrength(password || '')

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Rejoignez-nous et découvrez l'authentification sécurisée
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nom complet (optionnel)
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Adresse email *
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
              Mot de passe *
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Créez un mot de passe sécurisé"
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

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[80px]">
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <p>Le mot de passe doit contenir :</p>
                  <ul className="mt-1 space-y-1">
                    <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      • Au moins 8 caractères
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      • Une lettre minuscule
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      • Une lettre majuscule
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      • Un chiffre
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirmez votre mot de passe"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
              J'accepte les{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                conditions d'utilisation
              </Link>{' '}
              et la{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                politique de confidentialité
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Se connecter
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