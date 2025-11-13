/**
 * Schemas Zod para validação de workspaces
 * Valida dados de entrada dos endpoints de workspace
 */

import { z } from 'zod';
import { USER_ROLES } from '../types/enums';

/**
 * Schema: Criar novo workspace
 */
export const createWorkspaceSchema = z.object({
  nome: z
    .string({
      required_error: 'Nome do workspace é obrigatório',
      invalid_type_error: 'Nome do workspace deve ser um texto',
    })
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
 * Schema: Atualizar workspace
 */
export const updateWorkspaceSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome do workspace deve ter no mínimo 3 caracteres')
    .max(100, 'Nome do workspace deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug deve conter apenas letras minúsculas, números e hífens'
    )
    .optional(),

  plano_assinatura: z
    .string()
    .min(1, 'Plano de assinatura não pode ser vazio')
    .optional(),
});

/**
 * Schema: Convidar membro para workspace
 */
export const inviteMemberSchema = z.object({
  email: z
    .string({
      required_error: 'Email é obrigatório',
      invalid_type_error: 'Email deve ser um texto',
    })
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  role: z.enum(USER_ROLES as [string, ...string[]], {
    required_error: 'Role é obrigatória',
    invalid_type_error: `Role deve ser uma das opções: ${USER_ROLES.join(', ')}`,
  }),
});

/**
 * Schema: Atualizar role de membro
 */
export const updateMemberRoleSchema = z.object({
  role: z.enum(USER_ROLES as [string, ...string[]], {
    required_error: 'Role é obrigatória',
    invalid_type_error: `Role deve ser uma das opções: ${USER_ROLES.join(', ')}`,
  }),
});

/**
 * Schema: Parâmetro slug na URL
 */
export const workspaceSlugParamSchema = z.object({
  workspace_slug: z
    .string({
      required_error: 'Slug do workspace é obrigatório',
    })
    .min(3, 'Slug inválido')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido'),
});

/**
 * Schema: Parâmetro ID de membro na URL
 */
export const memberIdParamSchema = z.object({
  id: z
    .string({
      required_error: 'ID do membro é obrigatório',
    })
    .uuid('ID do membro inválido'),
});

/**
 * Tipos inferidos dos schemas
 */
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type WorkspaceSlugParam = z.infer<typeof workspaceSlugParamSchema>;
export type MemberIdParam = z.infer<typeof memberIdParamSchema>;
