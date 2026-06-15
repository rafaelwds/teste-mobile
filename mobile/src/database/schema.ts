import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * Schema local do WatermelonDB.
 * Os nomes das colunas batem com o que o backend devolve no /sync/pull,
 * para a sincronizacao funcionar sem mapeamentos extras.
 *
 * created_at / updated_at sao numeros (epoch em ms), padrao do WatermelonDB.
 */
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'empresas',
      columns: [
        { name: 'nome', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'usuarios',
      columns: [
        { name: 'nome', type: 'string' },
        { name: 'login', type: 'string' },
        { name: 'empresa_id', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'registros',
      columns: [
        { name: 'empresa_id', type: 'number' },
        { name: 'usuario_id', type: 'number' },
        { name: 'tipo', type: 'string' },
        { name: 'data_hora', type: 'number' },
        { name: 'descricao', type: 'string' },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'foto_registros',
      columns: [
        { name: 'registro_id', type: 'string', isIndexed: true },
        { name: 'empresa_id', type: 'number' },
        { name: 'usuario_id', type: 'number' },
        { name: 'local_path', type: 'string', isOptional: true },
        { name: 'remote_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
