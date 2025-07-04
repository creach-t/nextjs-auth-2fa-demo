import { z } from 'zod'

// Base email validation
const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .min(1, 'L\'email est requis')
  .max(255, 'L\'email ne peut pas dépasser 255 caractères')

// Password validation
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
  )

// Name validation
const nameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(50, 'Le nom ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides')
  .optional()

// 2FA code validation
const twoFACodeSchema = z
  .string()
  .length(6, 'Le code doit contenir exactement 6 chiffres')
  .regex(/^\d{6}$/, 'Le code doit contenir uniquement des chiffres')

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est requis'),
})

// Register schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

// 2FA verification schema
export const verifyTwoFASchema = z.object({
  email: emailSchema,
  code: twoFACodeSchema,
})

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirmNewPassword'],
})

// Profile update schema
export const updateProfileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

// Password reset request schema
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
})

// Password reset schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

// Type exports for forms
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type VerifyTwoFAFormData = z.infer<typeof verifyTwoFASchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type ResetPasswordRequestFormData = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>