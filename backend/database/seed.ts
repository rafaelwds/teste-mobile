import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db';

/**
 * Insere os dados iniciais obrigatorios:
 *   - Empresas: Alpha LTDA (id 1) e Beta LTDA (id 2)
 *   - Usuarios: joao@alpha.com e maria@beta.com (senha 123456, com hash)
 *
 * Idempotente: usa INSERT ... ON DUPLICATE KEY para nao duplicar.
 * Rode com: npm run seed
 */
async function seed() {
  console.log('[seed] Inserindo empresas...');
  await pool.query(
    `INSERT INTO empresa (id, nome) VALUES (1, 'Alpha LTDA'), (2, 'Beta LTDA')
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), updated_at = CURRENT_TIMESTAMP`,
  );

  const senhaHash = await bcrypt.hash('123456', 10);

  console.log('[seed] Inserindo usuarios...');
  await pool.query(
    `INSERT INTO usuario (id, nome, login, senha, empresa_id) VALUES
       (1, 'Joao Alpha', 'joao@alpha.com', ?, 1),
       (2, 'Maria Beta', 'maria@beta.com', ?, 2)
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha = VALUES(senha),
       empresa_id = VALUES(empresa_id), updated_at = CURRENT_TIMESTAMP`,
    [senhaHash, senhaHash],
  );

  console.log('[seed] Concluido. Logins de teste:');
  console.log('       joao@alpha.com / 123456  (empresa Alpha)');
  console.log('       maria@beta.com / 123456  (empresa Beta)');

  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Erro:', err.message);
  process.exit(1);
});
