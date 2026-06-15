import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Migrations do WatermelonDB.
 * Comeca vazio (versao 1). Ao evoluir o schema, incremente a versao em schema.ts
 * e adicione um passo de migration aqui.
 */
export const migrations = schemaMigrations({
  migrations: [],
});
