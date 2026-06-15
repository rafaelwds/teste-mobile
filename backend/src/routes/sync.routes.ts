import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { pull, push } from '../services/sync.service';

const router = Router();

// Todas as rotas de sync exigem autenticacao.
router.use(authMiddleware);

/**
 * GET /sync/pull?lastPulledAt=timestamp
 * Retorna as alteracoes do servidor (apenas da empresa do usuario).
 */
router.get('/pull', async (req: AuthRequest, res) => {
  const lastPulledAt = Number(req.query.lastPulledAt ?? 0) || 0;
  try {
    const result = await pull(req.user!, lastPulledAt);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /sync/push
 * Body: { changes, lastPulledAt }
 * Aplica as alteracoes vindas do app respeitando a empresa do usuario.
 */
router.post('/push', async (req: AuthRequest, res) => {
  const { changes } = req.body ?? {};
  if (!changes) {
    return res.status(400).json({ error: 'Campo "changes" obrigatorio' });
  }
  try {
    const result = await push(req.user!, changes);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
