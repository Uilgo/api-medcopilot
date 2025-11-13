/**
 * Rotas de Membros
 * Define endpoints relacionados a membros de workspaces
 */

import { Router } from 'express';
import * as memberController from '../controllers/member.controller';
import { validate } from '../middlewares/validate';
import { requireAdmin, requireProfessional } from '../middlewares/authorize';
import { workspaceContext } from '../middlewares/workspace';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  memberIdParamSchema,
  workspaceSlugParamSchema,
} from '../schemas/workspace.schema';

const router = Router({ mergeParams: true });

/**
 * POST /api/:workspace_slug/members
 * Convidar membro para workspace
 * Requer autenticação, acesso ao workspace e role ADMIN
 */
router.post(
  '/',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(inviteMemberSchema, 'body'),
  ...workspaceContext,
  requireAdmin,
  memberController.inviteMember
);

/**
 * GET /api/:workspace_slug/members
 * Listar membros do workspace
 * Requer autenticação e acesso ao workspace
 * ADMIN e PROFESSIONAL podem listar
 */
router.get(
  '/',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  ...workspaceContext,
  requireProfessional,
  memberController.getMembers
);

/**
 * GET /api/:workspace_slug/members/:id
 * Buscar membro por ID
 * Requer autenticação e acesso ao workspace
 */
router.get(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(memberIdParamSchema, 'params'),
  ...workspaceContext,
  requireProfessional,
  memberController.getMember
);

/**
 * PATCH /api/:workspace_slug/members/:id
 * Atualizar role de membro
 * Requer autenticação, acesso ao workspace e role ADMIN
 */
router.patch(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(memberIdParamSchema, 'params'),
  validate(updateMemberRoleSchema, 'body'),
  ...workspaceContext,
  requireAdmin,
  memberController.updateMemberRole
);

/**
 * DELETE /api/:workspace_slug/members/:id
 * Remover membro do workspace
 * Requer autenticação, acesso ao workspace e role ADMIN
 */
router.delete(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(memberIdParamSchema, 'params'),
  ...workspaceContext,
  requireAdmin,
  memberController.removeMember
);

export default router;
