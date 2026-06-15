import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { env } from '../config/env';

interface UsuarioRow extends RowDataPacket {
  id: number;
  nome: string;
  login: string;
  senha: string;
  empresa_id: number;
}

export interface PublicUser {
  id: number;
  nome: string;
  login: string;
  empresa_id: number;
}

/**
 * Valida login + senha contra o MySQL e devolve um token JWT.
 * Lanca erro com mensagem amigavel quando as credenciais sao invalidas.
 */
export async function login(loginInput: string, senha: string) {
  const [rows] = await pool.query<UsuarioRow[]>(
    'SELECT id, nome, login, senha, empresa_id FROM usuario WHERE login = ? AND deleted_at IS NULL LIMIT 1',
    [loginInput],
  );

  const usuario = rows[0];
  if (!usuario) {
    throw new Error('Usuario ou senha invalidos');
  }

  const senhaOk = await bcrypt.compare(senha, usuario.senha);
  if (!senhaOk) {
    throw new Error('Usuario ou senha invalidos');
  }

  const token = jwt.sign(
    { id: usuario.id, empresa_id: usuario.empresa_id, login: usuario.login },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn } as jwt.SignOptions,
  );

  const user: PublicUser = {
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    empresa_id: usuario.empresa_id,
  };

  return { token, user };
}

/** Busca os dados publicos (sem senha) de um usuario por id. */
export async function getUserById(id: number): Promise<PublicUser | null> {
  const [rows] = await pool.query<UsuarioRow[]>(
    'SELECT id, nome, login, empresa_id FROM usuario WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id],
  );
  const u = rows[0];
  if (!u) return null;
  return { id: u.id, nome: u.nome, login: u.login, empresa_id: u.empresa_id };
}
