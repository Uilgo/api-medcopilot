/**
 * Controller de Membros
 * Gerencia requisições HTTP relacionadas a membros de workspaces
 */

import { Request, Response, NextFunction } from 'express';
import * as memberService from '../services/member.service';
import type { InviteMemberInput, UpdateMemberRoleInput } from '../schemas/workspace.schema';

/**
 * POST /api/:workspace_slug/members
 * Convidar membro para workspace
 */
export const inviteMember = async (
  req: Request<{ workspace_slug: string }, {}, InviteMemberInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = (req as any).workspace_id;
    const userId = (req as any).user_id;

    if (!workspaceId || !userId) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    const result = await memberService.inviteMember(workspaceId, req.body, userId);

    res.status(201).json({
      message: 'Membro convidado com sucesso',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/members
 * Listar membros do workspace
 */
export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = (req as any).workspace_id;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace não encontrado' });
    }

    const members = await memberService.getWorkspaceMembers(workspaceId);

    res.status(200).json({
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/members/:id
 * Buscar membro por ID
 */
export const getMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workspaceId = (req as any).workspace_id;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace não encontrado' });
    }

    const member = await memberService.getMemberById(id, workspaceId);

    res.status(200).json({
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/:workspace_slug/members/:id
 * Atualizar role de membro
 */
export const updateMemberRole = async (
  req: Request<{ workspace_slug: string; id: string }, {}, UpdateMemberRoleInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workspaceId = (req as any).workspace_id;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace não encontrado' });
    }

    const member = await memberService.updateMemberRole(id, workspaceId, req.body);

    res.status(200).json({
      message: 'Role atualizada com sucesso',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/:workspace_slug/members/:id
 * Remover membro do workspace
 */
export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workspaceId = (req as any).workspace_id;
    const userId = (req as any).user_id;

    if (!workspaceId || !userId) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    const result = await memberService.removeMember(id, workspaceId, userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
