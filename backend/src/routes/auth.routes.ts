import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getUserById, login } from '../services/auth.service';

const router = Router();

/**
 * POST /auth/login
 * Body: { login, senha }
 * Retorna: { token, user }
 */
router.post('/login', async (req, res) => {
  const { login: loginInput, senha } = req.body ?? {};

  if (!loginInput || !senha) {
    return res.status(400).json({ error: 'Informe login e senha' });
  }

  try {
    const result = await login(String(loginInput), String(senha));
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message });
  }
});

/**
 * GET /auth/me
 * Retorna os dados do usuario autenticado.
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario nao encontrado' });
  }
  return res.json({ user });
});

export default router;
