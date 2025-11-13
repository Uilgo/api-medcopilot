/**
 * Rotas de Workspace
 * Define endpoints relacionados a workspaces
 */

import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller';
import { validate } from '../middlewares/validate';
import { requireAdmin } from '../middlewares/authorize';
import { workspaceContext } from '../middlewares/workspace';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceSlugParamSchema,
} from '../schemas/workspace.schema';

const router = Router();

/**
 * POST /api/workspaces
 * Criar novo workspace
 * Requer autenticação
 */
router.post(
  '/',
  // TODO: Adicionar middleware de autenticação
  validate(createWorkspaceSchema, 'body'),
  workspaceController.createWorkspace
);

/**
 * GET /api/workspaces/:slug
 * Buscar detalhes do workspace
 * Requer autenticação e acesso ao workspace
 */
router.get(
  '/:slug',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  workspaceController.getWorkspace
);

/**
 * PATCH /api/workspaces/:slug
 * Atualizar workspace
 * Requer autenticação, acesso ao workspace e role ADMIN
 */
router.patch(
  '/:slug',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(updateWorkspaceSchema, 'body'),
  ...workspaceContext,
  requireAdmin,
  workspaceController.updateWorkspace
);

/**
 * DELETE /api/workspaces/:slug
 * Deletar workspace
 * Requer autenticação, acesso ao workspace e ser owner
 */
router.delete(
  '/:slug',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  ...workspaceContext,
  requireAdmin,
  workspaceController.deleteWorkspace
);

export default router;
