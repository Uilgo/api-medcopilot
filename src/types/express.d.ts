/**
 * Extensão de tipos do Express
 * Adiciona propriedades customizadas ao Request
 */

import { UserRole } from './enums';

declare global {
  namespace Express {
    interface Request {
      /**
       * ID do usuário autenticado (injetado pelo middleware de autenticação)
       */
      user_id?: string;

      /**
       * ID do workspace ativo (injetado pelo middleware workspaceContext)
       */
      workspace_id?: string;

      /**
       * Slug do workspace ativo (injetado pelo middleware extractWorkspaceSlug)
       */
      workspace_slug?: string;

      /**
       * Role do usuário no workspace ativo (injetado pelo middleware workspaceContext)
       */
      user_role?: UserRole;
    }
  }
}

export { };
