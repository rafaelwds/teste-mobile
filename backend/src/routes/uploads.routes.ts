import crypto from 'crypto';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { pool } from '../config/db';
import { env } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { nowMysql } from '../utils/time';

const router = Router();

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /uploads/fotos  (multipart/form-data)
 * Campos:
 *   - foto: arquivo (obrigatorio)
 *   - foto_id: id da linha foto_registro (opcional, para vincular o remote_url)
 *   - registro_id: id do registro (opcional)
 * Retorna: { url, path, filename }
 */
router.post('/fotos', authMiddleware, upload.single('foto'), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo "foto" obrigatorio' });
  }

  const relativePath = `/uploads/${req.file.filename}`;
  const url = `${env.publicUrl}${relativePath}`;

  // Se o app informou o id da foto, vinculamos o remote_url no banco.
  const fotoId = req.body?.foto_id ? String(req.body.foto_id) : null;
  if (fotoId) {
    await pool.query(
      `UPDATE foto_registro SET remote_url = ?, updated_at = ?
        WHERE id = ? AND empresa_id = ?`,
      [url, nowMysql(), fotoId, req.user!.empresa_id],
    );
  }

  return res.json({ url, path: relativePath, filename: req.file.filename });
});

export default router;
