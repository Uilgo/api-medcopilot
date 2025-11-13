/**
 * Controller de Consultas
 * Gerencia requisições HTTP relacionadas a consultas
 */

import { Request, Response, NextFunction } from 'express';
import * as consultationService from '../services/consultation.service';
import { getWorkspaceId } from '../utils/type-guards';

/**
 * POST /api/:workspace_slug/consultations
 * Criar nova consulta
 */
export const createConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { paciente_id, queixa_principal } = req.body;

    if (!paciente_id) {
      return res.status(400).json({ message: 'ID do paciente é obrigatório' });
    }

    const consultation = await consultationService.createConsultation(
      workspaceId,
      paciente_id,
      queixa_principal
    );

    res.status(201).json({
      message: 'Consulta criada com sucesso',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/consultations
 * Listar consultas com filtros e paginação
 */
export const getConsultations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { page, limit, status, profissional_id, paciente_id } = req.query;

    const result = await consultationService.getConsultations(workspaceId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      profissional_id: profissional_id as string,
      paciente_id: paciente_id as string,
    });

    res.status(200).json({
      data: result.consultations,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/consultations/:id
 * Buscar consulta por ID
 */
export const getConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workspaceId = getWorkspaceId(req);
    const consultation = await consultationService.getConsultationById(id, workspaceId);

    res.status(200).json({
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/:workspace_slug/consultations/:id
 * Atualizar consulta
 */
export const updateConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { queixa_principal, status } = req.body;

    const consultation = await consultationService.updateConsultation(id, {
      queixa_principal,
      status,
    });

    res.status(200).json({
      message: 'Consulta atualizada com sucesso',
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/:workspace_slug/consultations/:id
 * Deletar consulta
 */
export const deleteConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await consultationService.deleteConsultation(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
