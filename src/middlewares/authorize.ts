/**
 * Middleware de Autorização (RBAC)
 * Verifica se o usuário tem a role necessária para acessar o recurso
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { UserRole } from '../types/enums';

/**
 * Middleware: Verificar se usuário tem uma das roles permitidas
 * 
 * @param allowedRoles - Array de roles permitidas
 * @returns Middleware Express
 * 
 * @example
 * router.post('/members', requireRole(['ADMIN']), controller.create);
 * router.get('/consultations', requireRole(['ADMIN', 'PROFESSIONAL']), controller.list);
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = (req as any).user_role as UserRole;

      if (!userRole) {
        throw new AppError('Role do usuário não encontrada', 403);
      }

      if (!allowedRoles.includes(userRole)) {
        throw new AppError(
          `Acesso negado. Roles permitidas: ${allowedRoles.join(', ')}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware: Apenas ADMIN
 * Atalho para requireRole(['ADMIN'])
 */
export const requireAdmin = requireRole([UserRole.ADMIN]);

/**
 * Middleware: ADMIN ou PROFESSIONAL
 * Atalho para requireRole(['ADMIN', 'PROFESSIONAL'])
 */
export const requireProfessional = requireRole([UserRole.ADMIN, UserRole.PROFESSIONAL]);

/**
 * Middleware: Verificar ownership de recurso
 * Verifica se o usuário é dono do recurso ou é ADMIN
 * 
 * @param getResourceOwnerId - Função que retorna o ID do dono do recurso
 * @returns Middleware Express
 * 
 * @example
 * router.patch(
 *   '/consultations/:id',
 *   checkOwnership(async (req) => {
 *     const consultation = await getConsultationById(req.params.id);
 *     return consultation.profissional_id;
 *   }),
 *   controller.update
 * );
 */
export const checkOwnership = (
  getResourceOwnerId: (req: Request) => Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user_id as string;
      const userRole = (req as any).user_role as UserRole;

      // ADMIN tem acesso total
      if (userRole === UserRole.ADMIN) {
        return next();
      }

      // Buscar ID do dono do recurso
      const ownerId = await getResourceOwnerId(req);

      // Verificar se usuário é o dono
      if (userId !== ownerId) {
        throw new AppError('Você não tem permissão para acessar este recurso', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper: Verificar se usuário é ADMIN
 */
export const isAdmin = (req: Request): boolean => {
  const userRole = (req as any).user_role as UserRole;
  return userRole === UserRole.ADMIN;
};

/**
 * Helper: Verificar se usuário é PROFESSIONAL ou ADMIN
 */
export const isProfessional = (req: Request): boolean => {
  const userRole = (req as any).user_role as UserRole;
  return userRole === UserRole.ADMIN || userRole === UserRole.PROFESSIONAL;
};

/**
 * Helper: Verificar se usuário é STAFF
 */
export const isStaff = (req: Request): boolean => {
  const userRole = (req as any).user_role as UserRole;
  return userRole === UserRole.STAFF;
};
