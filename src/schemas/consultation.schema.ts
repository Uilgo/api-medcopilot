/**
 * Schemas Zod para validação de consultas
 * Valida dados de entrada dos endpoints de consultas
 */

import { z } from 'zod';
import { CONSULTATION_STATUSES } from '../types/enums';

/**
 * Schema: Criar consulta
 */
export const createConsultationSchema = z.object({
  paciente_id: z
    .string({ message: 'ID do paciente é obrigatório' })
    .uuid('ID do paciente inválido'),

  queixa_principal: z
    .string()
    .min(3, 'Queixa principal deve ter no mínimo 3 caracteres')
    .max(1000, 'Queixa principal deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),
});

/**
 * Schema: Atualizar consulta
 */
export const updateConsultationSchema = z.object({
  queixa_principal: z
    .string()
    .min(3, 'Queixa principal deve ter no mínimo 3 caracteres')
    .max(1000, 'Queixa principal deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),

  status: z
    .enum(CONSULTATION_STATUSES as [string, ...string[]])
    .optional(),

  concluida_em: z
    .string()
    .datetime('Data de conclusão deve estar no formato ISO 8601')
    .optional(),
});

/**
 * Schema: Parâmetro ID de consulta na URL
 */
export const consultationIdParamSchema = z.object({
  id: z
    .string({ message: 'ID da consulta é obrigatório' })
    .uuid('ID da consulta inválido'),
});

/**
 * Schema: Query params para listagem de consultas
 */
export const consultationListQuerySchema = z.object({
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

  status: z
    .enum(CONSULTATION_STATUSES as [string, ...string[]])
    .optional(),

  paciente_id: z
    .string()
    .uuid('ID do paciente inválido')
    .optional(),

  profissional_id: z
    .string()
    .uuid('ID do profissional inválido')
    .optional(),

  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),

  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
});

/**
 * Validação customizada: data_fim deve ser maior que data_inicio
 */
export const consultationListQueryWithValidation = consultationListQuerySchema.refine(
  (data) => {
    if (data.data_inicio && data.data_fim) {
      const inicio = new Date(data.data_inicio);
      const fim = new Date(data.data_fim);
      return fim >= inicio;
    }
    return true;
  },
  {
    message: 'Data de fim deve ser maior ou igual à data de início',
    path: ['data_fim'],
  }
);

/**
 * Tipos inferidos dos schemas
 */
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
export type ConsultationIdParam = z.infer<typeof consultationIdParamSchema>;
export type ConsultationListQuery = z.infer<typeof consultationListQuerySchema>;
