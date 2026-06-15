import { createApp } from './app';
import { env } from './config/env';
import { pool } from './config/db';

async function main() {
  // Valida a conexao com o MySQL antes de subir o servidor.
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[db] Conexao com MySQL OK');
  } catch (err) {
    console.error('[db] Falha ao conectar no MySQL:', (err as Error).message);
    console.error('     Confira o arquivo .env e se o MySQL esta rodando.');
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] Rodando em ${env.publicUrl} (porta ${env.port})`);
  });
}

main();
