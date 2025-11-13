/**
 * Middleware de validação usando Zod
 * Valida dados de entrada (body, params, query) contra schemas Zod
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

/**
 * Tipo para definir qual parte do request validar
 */
type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Middleware genérico de validação
 * 
 * @param schema - Schema Zod para validação
 * @param target - Parte do request a validar (body, params ou query)
 * @returns Middleware Express
 * 
 * @example
 * router.post('/signup', validate(signupSchema, 'body'), authController.signup);
 * router.get('/users/:id', validate(userIdParamSchema, 'params'), userController.getById);
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Seleciona a parte do request a validar
      const dataToValidate = req[target];

      // Valida os dados contra o schema
      const validatedData = await schema.parseAsync(dataToValidate);

      // Substitui os dados originais pelos validados e transformados
      req[target] = validatedData;

      next();
    } catch (error) {
      // Se for erro de validação do Zod
      if (error instanceof ZodError) {
        // Formata os erros de validação
        const formattedErrors = error.issues.map((err: any) => ({
          campo: err.path.join('.'),
          mensagem: err.message,
        }));

        // Retorna erro 400 com detalhes dos erros de validação
        return next(
          new AppError(
            'Erro de validação',
            400,
            formattedErrors
          )
        );
      }

      // Se for outro tipo de erro, passa adiante
      next(error);
    }
  };
};

/**
 * Middleware para validar múltiplas partes do request
 * 
 * @param schemas - Objeto com schemas para cada parte do request
 * @returns Middleware Express
 * 
 * @example
 * router.patch(
 *   '/users/:id',
 *   validateMultiple({
 *     params: userIdParamSchema,
 *     body: updateUserSchema
 *   }),
 *   userController.update
 * );
 */
export const validateMultiple = (schemas: Partial<Record<ValidationTarget, ZodSchema>>) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Valida cada parte do request especificada
      for (const [target, schema] of Object.entries(schemas)) {
        if (schema) {
          const dataToValidate = req[target as ValidationTarget];
          const validatedData = await schema.parseAsync(dataToValidate);
          req[target as ValidationTarget] = validatedData;
        }
      }

      next();
    } catch (error) {
      // Se for erro de validação do Zod
      if (error instanceof ZodError) {
        // Formata os erros de validação
        const formattedErrors = error.issues.map((err: any) => ({
          campo: err.path.join('.'),
          mensagem: err.message,
        }));

        // Retorna erro 400 com detalhes dos erros de validação
        return next(
          new AppError(
            'Erro de validação',
            400,
            formattedErrors
          )
        );
      }

      // Se for outro tipo de erro, passa adiante
      next(error);
    }
  };
};

/**
 * Helper para validar dados fora de um middleware
 * Útil para validações em services ou utils
 * 
 * @param schema - Schema Zod para validação
 * @param data - Dados a validar
 * @returns Dados validados
 * @throws AppError se validação falhar
 * 
 * @example
 * const validatedData = await validateData(signupSchema, userData);
 */
export const validateData = async <T>(schema: ZodSchema<T>, data: unknown): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.issues.map((err: any) => ({
        campo: err.path.join('.'),
        mensagem: err.message,
      }));

      throw new AppError(
        'Erro de validação',
        400,
        formattedErrors
      );
    }

    throw error;
  }
};
