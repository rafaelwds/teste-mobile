import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUser {
  id: number;
  empresa_id: number;
  login: string;
}

/** Estende o Request do Express para carregar o usuario autenticado. */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware que valida o token JWT enviado em "Authorization: Bearer <token>".
 * Em caso de sucesso popula req.user com id, empresa_id e login.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao informado' });
  }

  const token = header.substring('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret) as AuthUser;
    req.user = {
      id: payload.id,
      empresa_id: payload.empresa_id,
      login: payload.login,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token invalido ou expirado' });
  }
}
