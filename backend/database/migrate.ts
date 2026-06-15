import fs from 'fs';
import path from 'path';
import { createRootPool } from '../src/config/db';
import { env } from '../src/config/env';

/**
 * Cria o database (se nao existir) e aplica o schema.sql.
 * Rode com: npm run migrate
 */
async function migrate() {
  const root = createRootPool();
  // Usa UMA conexao para garantir que o USE e o schema rodem na mesma sessao.
  const conn = await root.getConnection();

  console.log(`[migrate] Criando database "${env.db.database}" se necessario...`);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  await conn.query(`USE \`${env.db.database}\``);

  const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  console.log('[migrate] Aplicando schema.sql...');
  await conn.query(schema);

  conn.release();
  console.log('[migrate] Concluido com sucesso.');
  await root.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[migrate] Erro:', err.message);
  process.exit(1);
});
