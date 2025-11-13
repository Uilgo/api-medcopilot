import { Router } from 'express'
import { authenticate, AuthRequest } from '../middlewares/auth'

const router = Router()

// Rota de health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Exemplo de rota protegida
router.get('/protected', authenticate, (req: AuthRequest, res) => {
  res.json({
    message: 'Esta é uma rota protegida',
    user: req.user
  })
})

export default router
