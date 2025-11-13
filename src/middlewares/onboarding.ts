/**
 * Middleware de Onboarding
 * Verifica se o usuário completou o onboarding (criou workspace)
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';

/**
 * Middleware: Verificar se onboarding foi completado
 * Redireciona para /onboarding se não foi completado
 * 
 * Exceções:
 * - Rotas de auth (/api/auth/*)
 * - Rota de onboarding (/api/auth/onboarding)
 */
export const checkOnboardingComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user_id;

    if (!userId) {
      // Se não está autenticado, deixa o middleware de auth lidar
      return next();
    }

    // Exceções: rotas que não precisam de onboarding
    const exemptPaths = [
      '/api/auth/signup',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/me',
      '/api/auth/workspaces',
      '/api/auth/onboarding',
      '/api/health',
    ];

    // Verificar se a rota atual está nas exceções
    if (exemptPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Buscar status de onboarding do usuário
    const { data: userData, error } = await supabase
      .from('users')
      .select('onboarding')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      throw new AppError('Erro ao verificar status de onboarding', 500);
    }

    // Se onboarding não foi completado, retornar erro
    if (!userData.onboarding) {
      return res.status(403).json({
        error: 'Onboarding não completado',
        message: 'Você precisa completar o onboarding antes de acessar esta rota',
        redirect: '/onboarding',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Verificar se onboarding NÃO foi completado
 * Usado na rota de onboarding para evitar que usuários que já completaram acessem novamente
 */
export const checkOnboardingNotComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user_id;

    if (!userId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    // Buscar status de onboarding do usuário
    const { data: userData, error } = await supabase
      .from('users')
      .select('onboarding')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      throw new AppError('Erro ao verificar status de onboarding', 500);
    }

    // Se onboarding já foi completado, retornar erro
    if (userData.onboarding) {
      throw new AppError('Onboarding já foi completado', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};
