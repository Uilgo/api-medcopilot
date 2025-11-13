/**
 * Controller de Autenticação
 * Gerencia as requisições HTTP relacionadas à autenticação
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import type { SignupInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, OnboardingInput } from '../schemas/auth.schema';
import { getUserId } from '../utils/type-guards';

/**
 * POST /api/auth/signup
 * Registrar novo usuário
 */
export const signup = async (
  req: Request<{}, {}, SignupInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.signup(req.body);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      data: {
        user: result.user,
        session: result.session,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login de usuário
 */
export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      data: {
        user: result.user,
        session: result.session,
        workspaces: result.workspaces,
        onboarding_completo: result.onboarding_completo,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout de usuário
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.logout();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Solicitar reset de senha
 */
export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.forgotPassword(req.body.email);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Resetar senha com token
 */
export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, nova_senha } = req.body;
    const result = await authService.resetPassword(token, nova_senha);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Buscar dados do usuário autenticado
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getUserId(req);
    const result = await authService.getMe(userId);

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/workspaces
 * Listar workspaces do usuário
 */
export const getWorkspaces = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // userId virá do middleware de autenticação
    const userId = getUserId(req);
    const workspaces = await authService.getUserWorkspaces(userId);

    res.status(200).json({
      data: workspaces,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/onboarding
 * Completar onboarding (criar primeiro workspace)
 */
export const onboarding = async (
  req: Request<{}, {}, OnboardingInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getUserId(req);
    const result = await authService.completeOnboarding(userId, req.body);

    res.status(201).json({
      message: result.message,
      data: {
        workspace: result.workspace,
      },
    });
  } catch (error) {
    next(error);
  }
};
