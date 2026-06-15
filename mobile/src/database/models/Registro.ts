import { Model, Q, Query } from '@nozbe/watermelondb';
import { associations } from '@nozbe/watermelondb/Model';
import type { SyncStatus, TipoRegistro } from '../../types';
import type FotoRegistro from './FotoRegistro';
import { getRaw, setRaw } from './_raw';

export default class Registro extends Model {
  static table = 'registros';

  static associations = associations(['foto_registros', { type: 'has_many', foreignKey: 'registro_id' }]);

  get empresaId(): number {
    return getRaw(this, 'empresa_id') as number;
  }
  set empresaId(v: number) {
    setRaw(this, 'empresa_id', v);
  }

  get usuarioId(): number {
    return getRaw(this, 'usuario_id') as number;
  }
  set usuarioId(v: number) {
    setRaw(this, 'usuario_id', v);
  }

  get tipo(): TipoRegistro {
    return getRaw(this, 'tipo') as TipoRegistro;
  }
  set tipo(v: TipoRegistro) {
    setRaw(this, 'tipo', v);
  }

  get dataHora(): Date {
    return new Date(getRaw(this, 'data_hora') as number);
  }
  set dataHora(v: Date) {
    setRaw(this, 'data_hora', v ? v.getTime() : null);
  }

  get descricao(): string {
    return getRaw(this, 'descricao') as string;
  }
  set descricao(v: string) {
    setRaw(this, 'descricao', v);
  }

  // "syncState" (e nao "syncStatus", que ja existe no Model do WatermelonDB).
  get syncState(): SyncStatus {
    return getRaw(this, 'sync_status') as SyncStatus;
  }
  set syncState(v: SyncStatus) {
    setRaw(this, 'sync_status', v);
  }

  get createdAt(): Date {
    return new Date(getRaw(this, 'created_at') as number);
  }
  get updatedAt(): Date {
    return new Date(getRaw(this, 'updated_at') as number);
  }

  get fotos(): Query<FotoRegistro> {
    return this.collections.get<FotoRegistro>('foto_registros').query(Q.where('registro_id', this.id));
  }
}
