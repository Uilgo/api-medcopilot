/**
 * Controller de Workspace
 * Gerencia requisições HTTP relacionadas a workspaces
 */

import { Request, Response, NextFunction } from 'express';
import * as workspaceService from '../services/workspace.service';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '../schemas/workspace.schema';
import { getUserId, getWorkspaceId } from '../utils/type-guards';

/**
 * POST /api/workspaces
 * Criar novo workspace
 */
export const createWorkspace = async (
  req: Request<{}, {}, CreateWorkspaceInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getUserId(req);
    const workspace = await workspaceService.createWorkspace(userId, req.body);

    res.status(201).json({
      message: 'Workspace criado com sucesso',
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workspaces/:slug
 * Buscar detalhes do workspace
 */
export const getWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const userId = getUserId(req);
    const result = await workspaceService.getWorkspaceBySlug(slug, userId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/workspaces/:slug
 * Atualizar workspace (apenas ADMIN)
 */
export const updateWorkspace = async (
  req: Request<{ slug: string }, {}, UpdateWorkspaceInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const workspace = await workspaceService.updateWorkspace(workspaceId, req.body);

    res.status(200).json({
      message: 'Workspace atualizado com sucesso',
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/workspaces/:slug
 * Deletar workspace (apenas owner)
 */
export const deleteWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const result = await workspaceService.deleteWorkspace(workspaceId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
