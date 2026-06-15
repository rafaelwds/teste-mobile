import { Model } from '@nozbe/watermelondb';
import { date, field, relation } from '@nozbe/watermelondb/decorators';
import { associations } from '@nozbe/watermelondb/Model';
import type Registro from './Registro';

export default class FotoRegistro extends Model {
  static table = 'foto_registros';

  static associations = associations(['registros', { type: 'belongs_to', key: 'registro_id' }]);

  @field('registro_id') registroId!: string;
  @field('empresa_id') empresaId!: number;
  @field('usuario_id') usuarioId!: number;
  @field('local_path') localPath?: string;
  @field('remote_url') remoteUrl?: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('registros', 'registro_id') registro!: Registro;
}
