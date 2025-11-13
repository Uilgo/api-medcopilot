/**
 * Middleware de Workspace (Multi-Tenancy)
 * Extrai e valida o contexto do workspace a partir da URL
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';
import type { UserRole } from '../types/enums';

/**
 * Interface estendida do Request com contexto de workspace
 */
export interface WorkspaceRequest extends Request {
  user_id: string;
  workspace_id: string;
  workspace_slug: string;
  user_role: UserRole;
}

/**
 * Middleware: Extrair workspace_slug da URL
 * Extrai o slug do workspace do path params
 * 
 * Padrão de URL: /api/:workspace_slug/...
 */
export const extractWorkspaceContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspace_slug } = req.params;

    if (!workspace_slug) {
      throw new AppError('Workspace não especificado na URL', 400);
    }

    // Adiciona o slug ao request
    (req as any).workspace_slug = workspace_slug;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Validar acesso ao workspace
 * Verifica se o usuário autenticado pertence ao workspace
 * e injeta workspace_id e user_role no request
 */
export const validateWorkspaceAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user_id;
    const workspaceSlug = (req as any).workspace_slug;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!workspaceSlug) {
      throw new AppError('Workspace não especificado', 400);
    }

    // Buscar workspace pelo slug
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, nome, status_assinatura')
      .eq('slug', workspaceSlug)
      .single();

    if (workspaceError || !workspace) {
      throw new AppError('Workspace não encontrado', 404);
    }

    // Verificar se usuário é membro do workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('role, ativo')
      .eq('workspace_id', workspace.id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      throw new AppError('Você não tem acesso a este workspace', 403);
    }

    if (!member.ativo) {
      throw new AppError('Seu acesso a este workspace está inativo', 403);
    }

    // Verificar status da assinatura
    if (workspace.status_assinatura === 'suspended' || workspace.status_assinatura === 'cancelled') {
      throw new AppError('Este workspace está suspenso ou cancelado', 403);
    }

    // Injetar dados do workspace no request
    (req as any).workspace_id = workspace.id;
    (req as any).user_role = member.role;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware combinado: Extrair e validar workspace
 * Combina extractWorkspaceContext + validateWorkspaceAccess
 */
export const workspaceContext = [
  extractWorkspaceContext,
  validateWorkspaceAccess,
];
