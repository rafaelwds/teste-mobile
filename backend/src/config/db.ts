import mysql from 'mysql2/promise';
import { env } from './env';

/**
 * Pool de conexoes MySQL compartilhado por toda a aplicacao.
 * Usar pool evita abrir/fechar conexao a cada request.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // retorna DATETIME como string para conversao manual
});

/**
 * Pool sem database selecionado, usado apenas para criar o banco na migration.
 */
export function createRootPool() {
  return mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    waitForConnections: true,
    connectionLimit: 5,
    multipleStatements: true,
  });
}
