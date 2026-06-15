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

  console.log(`[migrate] Criando database "${env.db.database}" se necessario...`);
  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  await root.query(`USE \`${env.db.database}\``);

  const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  console.log('[migrate] Aplicando schema.sql...');
  await root.query(schema);

  console.log('[migrate] Concluido com sucesso.');
  await root.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[migrate] Erro:', err.message);
  process.exit(1);
});
