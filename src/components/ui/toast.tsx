'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  description: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (newToast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2)
    const toastWithId = { ...newToast, id }
    setToasts(prev => [...prev, toastWithId])

    // Auto-dismiss after duration
    const duration = newToast.duration || 5000
    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismissToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastComponent({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 150) // Wait for animation to complete
  }

  const variants = {
    default: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  }

  const variant = variants[toast.variant || 'default']
  const Icon = variant.icon

  return (
    <div
      className={cn(
        'transform transition-all duration-300 ease-in-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        'p-4 rounded-lg shadow-lg border',
        variant.bg,
        variant.border
      )}
    >
      <div className="flex items-start space-x-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', variant.iconColor)} />
        
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {toast.description}
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Helper functions for common toast types
export const showSuccessToast = (description: string, title?: string) => {
  const { toast } = useToast()
  toast({ variant: 'success', title, description })
}

export const showErrorToast = (description: string, title?: string) => {
  const { toast } = useToast()
  toast({ variant: 'error', title, description })
}

export const showWarningToast = (description: string, title?: string) => {
  const { toast } = useToast()
  toast({ variant: 'warning', title, description })
}

export const showInfoToast = (description: string, title?: string) => {
  const { toast } = useToast()
  toast({ variant: 'info', title, description })
}