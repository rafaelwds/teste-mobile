import path from 'path';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import uploadsRoutes from './routes/uploads.routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Servir as fotos enviadas de forma estatica.
  app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

  // Healthcheck simples.
  app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use('/auth', authRoutes);
  app.use('/sync', syncRoutes);
  app.use('/uploads', uploadsRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Rota nao encontrada' }));

  return app;
}
