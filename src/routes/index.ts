import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import memberRoutes from './member.routes';
import patientRoutes from './patient.routes';
import consultationRoutes from './consultation.routes';
import chatRoutes from './chat.routes';

const router = Router();

// Rota de health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (públicas)
router.use('/auth', authRoutes);

// Rotas de workspaces
router.use('/workspaces', workspaceRoutes);

// Rotas com contexto de workspace
router.use('/:workspace_slug/members', memberRoutes);
router.use('/:workspace_slug/patients', patientRoutes);
router.use('/:workspace_slug/consultations', consultationRoutes);
router.use('/:workspace_slug/chat', chatRoutes);

// Exemplo de rota protegida
router.get('/protected', authenticate, (req: AuthRequest, res) => {
  res.json({
    message: 'Esta é uma rota protegida',
    user: req.user,
  });
});

export default router;
