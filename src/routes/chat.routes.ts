/**
 * Rotas de Chat
 * Define endpoints relacionados a mensagens de chat
 */

import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { workspaceContext } from '../middlewares/workspace';
import { requireProfessional } from '../middlewares/authorize';

const router = Router({ mergeParams: true });

/**
 * POST /api/:workspace_slug/chat/message
 * Enviar mensagem de chat
 * Requer: ADMIN ou PROFESSIONAL
 */
router.post(
  '/message',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  requireProfessional,
  chatController.sendMessage
);

/**
 * GET /api/:workspace_slug/chat/:consultationId
 * Buscar mensagens de uma consulta
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/:consultationId',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  chatController.getMessages
);

/**
 * GET /api/:workspace_slug/chat/:consultationId/last
 * Buscar última mensagem de uma consulta
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/:consultationId/last',
  // TODO: Adicionar middleware de autenticação
  ...workspaceContext,
  chatController.getLastMessage
);

export default router;
