/**
 * Rotas de Pacientes
 * Define endpoints relacionados a pacientes
 */

import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { validate, validateMultiple } from '../middlewares/validate';
import { requireProfessional } from '../middlewares/authorize';
import { workspaceContext } from '../middlewares/workspace';
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdParamSchema,
  patientListQuerySchema,
} from '../schemas/patient.schema';
import { workspaceSlugParamSchema } from '../schemas/workspace.schema';

const router = Router({ mergeParams: true });

/**
 * POST /api/:workspace_slug/patients
 * Criar novo paciente
 * Requer: ADMIN ou PROFESSIONAL
 */
router.post(
  '/',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(createPatientSchema, 'body'),
  ...workspaceContext,
  requireProfessional,
  patientController.createPatient
);

/**
 * GET /api/:workspace_slug/patients
 * Listar pacientes com filtros e paginação
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  validate(patientListQuerySchema, 'query'),
  ...workspaceContext,
  patientController.getPatients
);

/**
 * GET /api/:workspace_slug/patients/search
 * Buscar pacientes (autocomplete)
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/search',
  // TODO: Adicionar middleware de autenticação
  validate(workspaceSlugParamSchema, 'params'),
  ...workspaceContext,
  patientController.searchPatients
);

/**
 * GET /api/:workspace_slug/patients/:id
 * Buscar paciente por ID
 * Requer: Qualquer membro do workspace
 */
router.get(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  validateMultiple({
    params: workspaceSlugParamSchema.merge(patientIdParamSchema),
  }),
  ...workspaceContext,
  patientController.getPatient
);

/**
 * PATCH /api/:workspace_slug/patients/:id
 * Atualizar paciente
 * Requer: ADMIN ou PROFESSIONAL
 */
router.patch(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  validateMultiple({
    params: workspaceSlugParamSchema.merge(patientIdParamSchema),
    body: updatePatientSchema,
  }),
  ...workspaceContext,
  requireProfessional,
  patientController.updatePatient
);

/**
 * DELETE /api/:workspace_slug/patients/:id
 * Deletar paciente
 * Requer: ADMIN ou PROFESSIONAL
 */
router.delete(
  '/:id',
  // TODO: Adicionar middleware de autenticação
  validateMultiple({
    params: workspaceSlugParamSchema.merge(patientIdParamSchema),
  }),
  ...workspaceContext,
  requireProfessional,
  patientController.deletePatient
);

export default router;
