/**
 * Rotas de Consultas
 * Define endpoints relacionados a consultas
 */

import { Router } from 'express';
import * as consultationController from '../controllers/consultation.controller';
import { workspaceContext } from '../middlewares/workspace';
import { requireProfessional } from '../middlewares/authorize';

const router = Router({ mergeParams: true });

/**
 * POST /api/:workspace_slug/consultations
 * Criar nova consulta
 * Requer: ADMIN ou PROFESSIONAL
 */
router.post(
  '/',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  requireProfessional,
  consultationController.createConsultation
);

/**
 * GET /api/:workspace_slug/consultations
 * Listar consultas com filtros e paginação
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  consultationController.getConsultations
);

/**
 * GET /api/:workspace_slug/consultations/:id
 * Buscar consulta por ID
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  consultationController.getConsultation
);

/**
 * PATCH /api/:workspace_slug/consultations/:id
 * Atualizar consulta
 * Requer: ADMIN ou PROFESSIONAL (dono da consulta)
 */
router.patch(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  requireProfessional,
  consultationController.updateConsultation
);

/**
 * DELETE /api/:workspace_slug/consultations/:id
 * Deletar consulta
 * Requer: ADMIN ou PROFESSIONAL (dono da consulta)
 */
router.delete(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  requireProfessional,
  consultationController.deleteConsultation
);

export default router;
