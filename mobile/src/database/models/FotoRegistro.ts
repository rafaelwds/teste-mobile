import { Model } from '@nozbe/watermelondb';
import { associations } from '@nozbe/watermelondb/Model';
import { getRaw, setRaw } from './_raw';

export default class FotoRegistro extends Model {
  static table = 'foto_registros';

  static associations = associations(['registros', { type: 'belongs_to', key: 'registro_id' }]);

  get registroId(): string {
    return getRaw(this, 'registro_id') as string;
  }
  set registroId(v: string) {
    setRaw(this, 'registro_id', v);
  }

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

  get localPath(): string | null {
    return getRaw(this, 'local_path') as string | null;
  }
  set localPath(v: string | null) {
    setRaw(this, 'local_path', v);
  }

  get remoteUrl(): string | null {
    return getRaw(this, 'remote_url') as string | null;
  }
  set remoteUrl(v: string | null) {
    setRaw(this, 'remote_url', v);
  }

  get createdAt(): Date {
    return new Date(getRaw(this, 'created_at') as number);
  }
  get updatedAt(): Date {
    return new Date(getRaw(this, 'updated_at') as number);
  }
}
