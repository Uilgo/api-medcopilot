/**
 * Schemas Zod para validação de pacientes
 * Valida dados de entrada dos endpoints de pacientes
 */

import { z } from 'zod';

/**
 * Regex para validação de CPF (formato: 000.000.000-00 ou 00000000000)
 */
const CPF_REGEX = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;

/**
 * Regex para validação de telefone brasileiro
 * Aceita: (00) 0000-0000, (00) 00000-0000, 00000000000, etc.
 */
const PHONE_REGEX = /^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/;

/**
 * Schema: Criar paciente
 */
export const createPatientSchema = z.object({
  nome: z
    .string({ message: 'Nome é obrigatório' })
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim(),

  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato YYYY-MM-DD')
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        return birthDate < today;
      },
      { message: 'Data de nascimento deve ser no passado' }
    )
    .optional(),

  cpf: z
    .string()
    .regex(CPF_REGEX, 'CPF inválido. Use o formato 000.000.000-00 ou 00000000000')
    .optional(),

  telefone: z
    .string()
    .regex(PHONE_REGEX, 'Telefone inválido. Use o formato (00) 00000-0000')
    .optional(),

  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .optional(),

  endereco: z
    .string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .trim()
    .optional(),

  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional(),
});

/**
 * Schema: Atualizar paciente
 * Todos os campos são opcionais
 */
export const updatePatientSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim()
    .optional(),

  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato YYYY-MM-DD')
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        return birthDate < today;
      },
      { message: 'Data de nascimento deve ser no passado' }
    )
    .optional(),

  cpf: z
    .string()
    .regex(CPF_REGEX, 'CPF inválido. Use o formato 000.000.000-00 ou 00000000000')
    .optional(),

  telefone: z
    .string()
    .regex(PHONE_REGEX, 'Telefone inválido. Use o formato (00) 00000-0000')
    .optional(),

  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .optional(),

  endereco: z
    .string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .trim()
    .optional(),

  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .trim()
    .optional(),
});

/**
 * Schema: Parâmetro ID de paciente na URL
 */
export const patientIdParamSchema = z.object({
  id: z
    .string({ message: 'ID do paciente é obrigatório' })
    .uuid('ID do paciente inválido'),
});

/**
 * Schema: Query params para listagem de pacientes
 */
export const patientListQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Página deve ser um número')
    .transform(Number)
    .refine((n) => n > 0, 'Página deve ser maior que 0')
    .optional()
    .default(1),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limite deve ser um número')
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, 'Limite deve estar entre 1 e 100')
    .optional()
    .default(10),

  search: z
    .string()
    .min(1, 'Busca deve ter no mínimo 1 caractere')
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
});

/**
 * Tipos inferidos dos schemas
 */
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientIdParam = z.infer<typeof patientIdParamSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
