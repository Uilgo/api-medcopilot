import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean
  details?: any

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    const response: any = {
      status: 'error',
      message: err.message,
    }

    // Adiciona detalhes se existirem
    if (err.details) {
      response.details = err.details
    }

    return res.status(err.statusCode).json(response)
  }

  console.error('ERRO:', err)

  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  })
}
