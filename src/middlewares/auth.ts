import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token não fornecido', 401)
    }

    const token = authHeader.substring(7)

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new AppError('Token inválido ou expirado', 401)
    }

    req.user = {
      id: user.id,
      email: user.email,
    }

    next()
  } catch (error) {
    next(error)
  }
}
