/**
 * Schemas Zod para validação de chat
 * Valida dados de entrada dos endpoints de chat
 */

import { z } from 'zod';

/**
 * Schema: Enviar mensagem de texto
 */
export const sendMessageSchema = z.object({
  consultation_id: z
    .string({ message: 'ID da consulta é obrigatório' })
    .uuid('ID da consulta inválido'),

  conteudo: z
    .string({ message: 'Conteúdo da mensagem é obrigatório' })
    .min(1, 'Mensagem não pode estar vazia')
    .max(5000, 'Mensagem deve ter no máximo 5000 caracteres')
    .trim(),
});

/**
 * Schema: Enviar mensagem de áudio
 */
export const sendAudioMessageSchema = z.object({
  consultation_id: z
    .string({ message: 'ID da consulta é obrigatório' })
    .uuid('ID da consulta inválido'),
});

/**
 * Schema: Parâmetro consultation_id na URL
 */
export const consultationIdParamSchema = z.object({
  consultationId: z
    .string({ message: 'ID da consulta é obrigatório' })
    .uuid('ID da consulta inválido'),
});

/**
 * Schema: Validação de arquivo de áudio
 * Usado no middleware de upload
 */
export const audioFileSchema = z.object({
  mimetype: z
    .string()
    .refine(
      (type) => type.startsWith('audio/'),
      'Arquivo deve ser um áudio'
    ),

  size: z
    .number()
    .max(50 * 1024 * 1024, 'Arquivo de áudio deve ter no máximo 50MB'),
});

/**
 * Schema: Query params para histórico de mensagens
 */
export const chatHistoryQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, 'Limite deve ser um número')
    .transform(Number)
    .refine((n) => n > 0 && n <= 200, 'Limite deve estar entre 1 e 200')
    .optional()
    .default(50),

  before: z
    .string()
    .uuid('ID da mensagem inválido')
    .optional(),
});

/**
 * Tipos inferidos dos schemas
 */
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendAudioMessageInput = z.infer<typeof sendAudioMessageSchema>;
export type ConsultationIdParam = z.infer<typeof consultationIdParamSchema>;
export type AudioFileValidation = z.infer<typeof audioFileSchema>;
export type ChatHistoryQuery = z.infer<typeof chatHistoryQuerySchema>;
