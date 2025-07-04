'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, ArrowLeft, RotateCcw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertIcon } from '@/components/ui/alert'
import { verifyTwoFASchema, type VerifyTwoFAFormData } from '@/lib/validations'
import { API_ROUTES } from '@/lib/constants'
import type { AuthResponse } from '@/types/auth'

export default function VerifyTwoFAPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyTwoFAFormData>({
    resolver: zodResolver(verifyTwoFASchema),
    defaultValues: {
      email,
      code: '',
    },
  })

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.push('/login')
    }
  }, [email, router])

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle code input
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    
    // Update form value
    setValue('code', newCode.join(''))
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      handleSubmit(onSubmit)()
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedText.length === 6) {
      const newCode = pastedText.split('')
      setCode(newCode)
      setValue('code', pastedText)
      
      // Focus last input
      inputRefs.current[5]?.focus()
      
      // Auto-submit
      setTimeout(() => {
        handleSubmit(onSubmit)()
      }, 100)
    }
  }

  const onSubmit = async (data: VerifyTwoFAFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(API_ROUTES.TWOFA.VERIFY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      })

      const result: AuthResponse = await response.json()

      if (!result.success) {
        setError(result.message)
        // Clear code on error
        setCode(['', '', '', '', '', ''])
        setValue('code', '')
        inputRefs.current[0]?.focus()
        return
      }

      setSuccess('Vérification réussie ! Redirection...')
      setTimeout(() => {
        router.push(callbackUrl)
      }, 1000)
    } catch (error) {
      console.error('2FA verification error:', error)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, resend: true }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Nouveau code envoyé ! Vérifiez votre email.')
        setTimeRemaining(300) // Reset timer
        setCode(['', '', '', '', '', ''])
        setValue('code', '')
        inputRefs.current[0]?.focus()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Erreur lors de l\'envoi du code. Veuillez réessayer.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Vérification en deux étapes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Nous avons envoyé un code de vérification à :
          </p>
          <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
            <Mail className="w-4 h-4 mr-2" />
            {email}
          </div>
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

        {/* Code Input */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
              Entrez le code à 6 chiffres
            </label>
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                  disabled={isLoading}
                />
              ))}
            </div>
            {errors.code && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                {errors.code.message}
              </p>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            {timeRemaining > 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Le code expire dans :{' '}
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(timeRemaining)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                Code expiré. Demandez un nouveau code.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            loading={isLoading}
            disabled={code.join('').length !== 6 || timeRemaining === 0}
            className="btn-primary"
          >
            {isLoading ? 'Vérification...' : 'Vérifier le code'}
          </Button>
        </form>

        {/* Resend Code */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Vous n'avez pas reçu le code ?
          </p>
          <Button
            variant="outline"
            onClick={handleResendCode}
            loading={isResending}
            disabled={timeRemaining > 240} // Can resend after 1 minute
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isResending ? 'Envoi...' : 'Renvoyer le code'}
          </Button>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}