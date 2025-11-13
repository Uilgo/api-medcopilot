/**
 * Schemas Zod para validação de autenticação
 * Valida dados de entrada dos endpoints de auth
 */

import { z } from 'zod';

/**
 * Schema: Cadastro de novo usuário
 */
export const signupSchema = z.object({
  nome: z
    .string({ message: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  sobrenome: z
    .string({ message: 'Sobrenome é obrigatório' })
    .min(2, 'Sobrenome deve ter no mínimo 2 caracteres')
    .max(100, 'Sobrenome deve ter no máximo 100 caracteres')
    .trim(),

  email: z
    .string({ message: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  senha: z
    .string({ message: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    ),
});

/**
 * Schema: Login de usuário
 */
export const loginSchema = z.object({
  email: z
    .string({ message: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  senha: z
    .string({ message: 'Senha é obrigatória' })
    .min(1, 'Senha é obrigatória'),
});

/**
 * Schema: Esqueci minha senha
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
});

/**
 * Schema: Resetar senha
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({ message: 'Token é obrigatório' })
    .min(1, 'Token é obrigatório'),

  nova_senha: z
    .string({ message: 'Nova senha é obrigatória' })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    ),
});

/**
 * Schema: Completar onboarding (criar primeiro workspace)
 */
export const onboardingSchema = z.object({
  nome_workspace: z
    .string({ message: 'Nome do workspace é obrigatório' })
    .min(3, 'Nome do workspace deve ter no mínimo 3 caracteres')
    .max(100, 'Nome do workspace deve ter no máximo 100 caracteres')
    .trim(),

  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug deve conter apenas letras minúsculas, números e hífens'
    )
    .optional(),
});

/**
 * Tipos inferidos dos schemas (útil para TypeScript)
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
