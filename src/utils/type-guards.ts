/**
 * Type Guards e Helpers de Tipagem
 * Funções para validar tipos em runtime de forma segura
 */

import { Request } from 'express';

/**
 * Type guard para verificar se Request tem user_id
 */
export function isAuthenticatedRequest(req: Request): req is Request & { user_id: string } {
  return 'user_id' in req && typeof req.user_id === 'string';
}

/**
 * Type guard para verificar se Request tem workspace_id
 */
export function hasWorkspaceContext(req: Request): req is Request & { workspace_id: string } {
  return 'workspace_id' in req && typeof req.workspace_id === 'string';
}

/**
 * Helper para extrair user_id de forma segura
 */
export function getUserId(req: Request): string {
  if (!isAuthenticatedRequest(req)) {
    throw new Error('Request não autenticado');
  }
  return req.user_id;
}

/**
 * Helper para extrair workspace_id de forma segura
 */
export function getWorkspaceId(req: Request): string {
  if (!hasWorkspaceContext(req)) {
    throw new Error('Workspace context não encontrado');
  }
  return req.workspace_id;
}

/**
 * Type guard para query params de paginação
 */
export interface PaginationQuery {
  page: number;
  limit: number;
}

export function parsePaginationQuery(query: unknown): PaginationQuery {
  if (typeof query !== 'object' || query === null) {
    return { page: 1, limit: 10 };
  }

  const q = query as Record<string, unknown>;

  const page = typeof q.page === 'string' ? parseInt(q.page, 10) : undefined;
  const limit = typeof q.limit === 'string' ? parseInt(q.limit, 10) : undefined;

  return {
    page: page && page > 0 ? page : 1,
    limit: limit && limit > 0 && limit <= 100 ? limit : 10,
  };
}

/**
 * Type guard para query params de busca
 */
export function parseSearchQuery(query: unknown): string | undefined {
  if (typeof query !== 'object' || query === null) {
    return undefined;
  }

  const q = query as Record<string, unknown>;
  return typeof q.search === 'string' ? q.search : undefined;
}
