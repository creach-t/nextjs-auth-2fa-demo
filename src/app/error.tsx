'use client'

import { ErrorFallback } from '@/components/ui/error-boundary'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error)
  }, [error])

  return <ErrorFallback error={error} resetErrorBoundary={reset} />
}