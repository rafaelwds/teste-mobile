import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { migrations } from './migrations';
import { schema } from './schema';
import Empresa from './models/Empresa';
import FotoRegistro from './models/FotoRegistro';
import Registro from './models/Registro';
import Usuario from './models/Usuario';

/**
 * Adapter SQLite do WatermelonDB.
 * jsi: false usa a ponte assincrona (mais simples de configurar no bare workflow).
 * Para maior performance pode-se ligar jsi: true depois de configurar o JSI nativo.
 */
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: false, // usa o modulo nativo nozbe_watermelondb por bridge (compativel com RN 0.85 / nova arquitetura)
  dbName: 'testeMobile',
  onSetUpError: (error) => {
    console.error('[watermelondb] Falha ao iniciar o banco local:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Empresa, Usuario, Registro, FotoRegistro],
});

// Atalhos para as collections, usados pelos services.
export const collections = {
  empresas: database.get<Empresa>('empresas'),
  usuarios: database.get<Usuario>('usuarios'),
  registros: database.get<Registro>('registros'),
  fotoRegistros: database.get<FotoRegistro>('foto_registros'),
};
