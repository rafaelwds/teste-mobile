import { Model, Query } from '@nozbe/watermelondb';
import { children, date, field, text } from '@nozbe/watermelondb/decorators';
import { associations } from '@nozbe/watermelondb/Model';
import type { SyncStatus, TipoRegistro } from '../../types';
import FotoRegistro from './FotoRegistro';

export default class Registro extends Model {
  static table = 'registros';

  static associations = associations(['foto_registros', { type: 'has_many', foreignKey: 'registro_id' }]);

  @field('empresa_id') empresaId: number;
  @field('usuario_id') usuarioId: number;
  @field('tipo') tipo: TipoRegistro;
  @date('data_hora') dataHora: Date;
  @text('descricao') descricao: string;
  // Renomeado para syncState porque "syncStatus" ja existe no Model do WatermelonDB.
  @field('sync_status') syncState: SyncStatus;
  @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;

  @children('foto_registros') fotos: Query<FotoRegistro>;
}
