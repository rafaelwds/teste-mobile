import { Model } from '@nozbe/watermelondb';
import { getRaw } from './_raw';

export default class Usuario extends Model {
  static table = 'usuarios';

  get nome(): string {
    return getRaw(this, 'nome') as string;
  }
  get login(): string {
    return getRaw(this, 'login') as string;
  }
  get empresaId(): number {
    return getRaw(this, 'empresa_id') as number;
  }
  get createdAt(): Date {
    return new Date(getRaw(this, 'created_at') as number);
  }
  get updatedAt(): Date {
    return new Date(getRaw(this, 'updated_at') as number);
  }
}
