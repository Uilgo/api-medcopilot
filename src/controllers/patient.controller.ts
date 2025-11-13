/**
 * Controller de Pacientes
 * Gerencia requisições HTTP relacionadas a pacientes
 */

import { Request, Response, NextFunction } from 'express';
import * as patientService from '../services/patient.service';
import type {
  CreatePatientInput,
  UpdatePatientInput,
  PatientListQuery,
} from '../schemas/patient.schema';
import { getWorkspaceId, parsePaginationQuery, parseSearchQuery } from '../utils/type-guards';

/**
 * POST /api/:workspace_slug/patients
 * Criar novo paciente
 */
export const createPatient = async (
  req: Request<{ workspace_slug: string }, {}, CreatePatientInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const patient = await patientService.createPatient(workspaceId, req.body);

    res.status(201).json({
      message: 'Paciente criado com sucesso',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/patients
 * Listar pacientes com filtros e paginação
 */
export const getPatients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const pagination = parsePaginationQuery(req.query);
    const search = parseSearchQuery(req.query);

    const filters: PatientListQuery = {
      ...pagination,
      search,
    };

    const result = await patientService.getPatients(workspaceId, filters);

    res.status(200).json({
      data: result.patients,
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
 * GET /api/:workspace_slug/patients/search
 * Buscar pacientes (autocomplete)
 */
export const searchPatients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { q, limit } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace não encontrado' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Parâmetro de busca (q) é obrigatório' });
    }

    const patients = await patientService.searchPatients(
      workspaceId,
      q,
      limit ? parseInt(limit as string) : 10
    );

    res.status(200).json({
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/:workspace_slug/patients/:id
 * Buscar paciente por ID
 */
export const getPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workspaceId = getWorkspaceId(req);

    const result = await patientService.getPatientById(id, workspaceId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/:workspace_slug/patients/:id
 * Atualizar paciente
 */
export const updatePatient = async (
  req: Request<{ workspace_slug: string; id: string }, {}, UpdatePatientInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const patient = await patientService.updatePatient(id, req.body);

    res.status(200).json({
      message: 'Paciente atualizado com sucesso',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/:workspace_slug/patients/:id
 * Deletar paciente
 */
export const deletePatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await patientService.deletePatient(id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
