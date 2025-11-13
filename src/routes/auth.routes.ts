/**
 * Rotas de Autenticação
 * Define todos os endpoints relacionados à autenticação
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
} from '../schemas/auth.schema';

const router = Router();

/**
 * POST /api/auth/signup
 * Registrar novo usuário
 */
router.post(
  '/signup',
  validate(signupSchema, 'body'),
  authController.signup
);

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post(
  '/login',
  validate(loginSchema, 'body'),
  authController.login
);

/**
 * POST /api/auth/logout
 * Logout de usuário
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * POST /api/auth/forgot-password
 * Solicitar reset de senha
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema, 'body'),
  authController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Resetar senha com token
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema, 'body'),
  authController.resetPassword
);

/**
 * GET /api/auth/me
 * Buscar dados do usuário autenticado
 * Requer autenticação
 */
router.get(
  '/me',
  // TODO: Adicionar middleware de autenticação
  authController.getMe
);

/**
 * GET /api/auth/workspaces
 * Listar workspaces do usuário
 * Requer autenticação
 */
router.get(
  '/workspaces',
  // TODO: Adicionar middleware de autenticação
  authController.getWorkspaces
);

/**
 * POST /api/auth/onboarding
 * Completar onboarding (criar primeiro workspace)
 * Requer autenticação
 */
router.post(
  '/onboarding',
  // TODO: Adicionar middleware de autenticação
  validate(onboardingSchema, 'body'),
  authController.onboarding
);

export default router;
