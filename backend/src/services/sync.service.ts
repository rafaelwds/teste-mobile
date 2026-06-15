import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db';
import { AuthUser } from '../middleware/auth';
import { epochToMysql, mysqlToEpoch, nowEpoch, nowMysql } from '../utils/time';

/**
 * Servico de sincronizacao compativel com o protocolo do WatermelonDB.
 *
 * Regras de seguranca importantes:
 * - O PULL so devolve dados da empresa do usuario autenticado.
 * - O PUSH sempre grava empresa_id/usuario_id a partir do token (nunca confia no app).
 * - Update/delete so e permitido em registros da mesma empresa do usuario.
 */

type Changes = {
  created: any[];
  updated: any[];
  deleted: string[];
};

type TableChanges = Record<string, Changes>;

const TIPOS_VALIDOS = ['COMPRA', 'VENDA'];

// ----------------------------------------------------------------------------
// PULL
// ----------------------------------------------------------------------------

export async function pull(user: AuthUser, lastPulledAt: number) {
  const empresaId = user.empresa_id;

  const empresas = await pullEmpresas(empresaId, lastPulledAt);
  const usuarios = await pullUsuarios(empresaId, lastPulledAt);
  const registros = await pullRegistros(empresaId, lastPulledAt);
  const foto_registros = await pullFotoRegistros(empresaId, lastPulledAt);

  return {
    changes: { empresas, usuarios, registros, foto_registros },
    timestamp: nowEpoch(),
  };
}

/** Decide em qual balde (created/updated/deleted) cada linha entra. */
function bucketize<T extends { id: any; created_at: number | null; updated_at: number | null }>(
  rows: any[],
  lastPulledAt: number,
  mapRow: (row: any) => T,
): Changes {
  const created: any[] = [];
  const updated: any[] = [];
  const deleted: string[] = [];

  for (const row of rows) {
    const id = String(row.id);
    if (row.deleted_at) {
      // So enviamos delecoes em syncs incrementais (lastPulledAt > 0).
      if (lastPulledAt > 0) deleted.push(id);
      continue;
    }
    const mapped = mapRow(row);
    const createdAt = mysqlToEpoch(row.created_at);
    if (lastPulledAt > 0 && createdAt !== null && createdAt <= lastPulledAt) {
      updated.push(mapped);
    } else {
      created.push(mapped);
    }
  }

  return { created, updated, deleted };
}

/** WHERE comum: somente alteracoes apos lastPulledAt (ou tudo na 1a sincronizacao). */
function changedWhere(lastPulledAt: number): { clause: string; params: any[] } {
  if (lastPulledAt > 0) {
    return { clause: 'updated_at > ?', params: [epochToMysql(lastPulledAt)] };
  }
  return { clause: 'deleted_at IS NULL', params: [] };
}

async function pullEmpresas(empresaId: number, lastPulledAt: number): Promise<Changes> {
  const { clause, params } = changedWhere(lastPulledAt);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM empresa WHERE id = ? AND ${clause}`,
    [empresaId, ...params],
  );
  return bucketize(rows, lastPulledAt, (r) => ({
    id: String(r.id),
    nome: r.nome,
    created_at: mysqlToEpoch(r.created_at),
    updated_at: mysqlToEpoch(r.updated_at),
  }));
}

async function pullUsuarios(empresaId: number, lastPulledAt: number): Promise<Changes> {
  const { clause, params } = changedWhere(lastPulledAt);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM usuario WHERE empresa_id = ? AND ${clause}`,
    [empresaId, ...params],
  );
  return bucketize(rows, lastPulledAt, (r) => ({
    id: String(r.id),
    nome: r.nome,
    login: r.login,
    empresa_id: r.empresa_id,
    created_at: mysqlToEpoch(r.created_at),
    updated_at: mysqlToEpoch(r.updated_at),
  }));
}

async function pullRegistros(empresaId: number, lastPulledAt: number): Promise<Changes> {
  const { clause, params } = changedWhere(lastPulledAt);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM registro WHERE empresa_id = ? AND ${clause}`,
    [empresaId, ...params],
  );
  return bucketize(rows, lastPulledAt, (r) => ({
    id: String(r.id),
    empresa_id: r.empresa_id,
    usuario_id: r.usuario_id,
    tipo: r.tipo,
    data_hora: mysqlToEpoch(r.data_hora),
    descricao: r.descricao,
    sync_status: 'synced', // tudo que vem do servidor ja esta sincronizado
    created_at: mysqlToEpoch(r.created_at),
    updated_at: mysqlToEpoch(r.updated_at),
  }));
}

async function pullFotoRegistros(empresaId: number, lastPulledAt: number): Promise<Changes> {
  const { clause, params } = changedWhere(lastPulledAt);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM foto_registro WHERE empresa_id = ? AND ${clause}`,
    [empresaId, ...params],
  );
  return bucketize(rows, lastPulledAt, (r) => ({
    id: String(r.id),
    registro_id: String(r.registro_id),
    empresa_id: r.empresa_id,
    usuario_id: r.usuario_id,
    local_path: r.local_path,
    remote_url: r.remote_url,
    created_at: mysqlToEpoch(r.created_at),
    updated_at: mysqlToEpoch(r.updated_at),
  }));
}

// ----------------------------------------------------------------------------
// PUSH
// ----------------------------------------------------------------------------

export async function push(user: AuthUser, changes: TableChanges) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const registros = changes.registros ?? { created: [], updated: [], deleted: [] };
    const fotos = changes.foto_registros ?? { created: [], updated: [], deleted: [] };

    for (const r of [...(registros.created ?? []), ...(registros.updated ?? [])]) {
      await upsertRegistro(conn, user, r);
    }
    for (const id of registros.deleted ?? []) {
      await softDelete(conn, user, 'registro', String(id));
    }

    for (const f of [...(fotos.created ?? []), ...(fotos.updated ?? [])]) {
      await upsertFoto(conn, user, f);
    }
    for (const id of fotos.deleted ?? []) {
      await softDelete(conn, user, 'foto_registro', String(id));
    }

    await conn.commit();
    return { ok: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Garante que o registro (se existir) pertence a empresa do usuario. */
async function assertOwnership(
  conn: PoolConnection,
  table: 'registro' | 'foto_registro',
  id: string,
  empresaId: number,
): Promise<boolean> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT empresa_id FROM ${table} WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return false; // nao existe -> sera um insert
  if (row.empresa_id !== empresaId) {
    throw new Error('Acesso negado: registro de outra empresa');
  }
  return true; // existe e e da empresa -> update
}

async function upsertRegistro(conn: PoolConnection, user: AuthUser, r: any) {
  const id = String(r.id);
  const tipo = String(r.tipo ?? '').toUpperCase();
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new Error(`Tipo invalido: ${r.tipo}`);
  }
  const descricao = String(r.descricao ?? '');
  const dataHora = epochToMysql(r.data_hora) ?? nowMysql();
  const now = nowMysql();

  const exists = await assertOwnership(conn, 'registro', id, user.empresa_id);

  if (exists) {
    await conn.query(
      `UPDATE registro
         SET tipo = ?, data_hora = ?, descricao = ?, updated_at = ?, deleted_at = NULL
       WHERE id = ?`,
      [tipo, dataHora, descricao, now, id],
    );
  } else {
    await conn.query(
      `INSERT INTO registro
         (id, empresa_id, usuario_id, tipo, data_hora, descricao, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [id, user.empresa_id, user.id, tipo, dataHora, descricao, epochToMysql(r.created_at) ?? now, now],
    );
  }
}

async function upsertFoto(conn: PoolConnection, user: AuthUser, f: any) {
  const id = String(f.id);
  const registroId = String(f.registro_id);
  const localPath = f.local_path ?? null;
  const remoteUrl = f.remote_url ?? null;
  const now = nowMysql();

  const exists = await assertOwnership(conn, 'foto_registro', id, user.empresa_id);

  if (exists) {
    await conn.query(
      `UPDATE foto_registro
         SET registro_id = ?, local_path = ?, remote_url = ?, updated_at = ?, deleted_at = NULL
       WHERE id = ?`,
      [registroId, localPath, remoteUrl, now, id],
    );
  } else {
    await conn.query(
      `INSERT INTO foto_registro
         (id, registro_id, empresa_id, usuario_id, local_path, remote_url, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [id, registroId, user.empresa_id, user.id, localPath, remoteUrl, epochToMysql(f.created_at) ?? now, now],
    );
  }
}

async function softDelete(
  conn: PoolConnection,
  user: AuthUser,
  table: 'registro' | 'foto_registro',
  id: string,
) {
  const exists = await assertOwnership(conn, table, id, user.empresa_id);
  if (!exists) return; // nada para apagar
  const now = nowMysql();
  await conn.query(
    `UPDATE ${table} SET deleted_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, id],
  );
}
