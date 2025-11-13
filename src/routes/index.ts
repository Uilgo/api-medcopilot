import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import memberRoutes from './member.routes';

const router = Router();

// Rota de health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (públicas)
router.use('/auth', authRoutes);

// Rotas de workspaces
router.use('/workspaces', workspaceRoutes);

// Rotas de membros (com contexto de workspace)
router.use('/:workspace_slug/members', memberRoutes);

// Exemplo de rota protegida
router.get('/protected', authenticate, (req: AuthRequest, res) => {
  res.json({
    message: 'Esta é uma rota protegida',
    user: req.user,
  });
});

export default router;
