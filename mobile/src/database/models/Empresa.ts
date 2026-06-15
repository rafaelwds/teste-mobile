import { Model } from '@nozbe/watermelondb';
import { getRaw } from './_raw';

export default class Empresa extends Model {
  static table = 'empresas';

  get nome(): string {
    return getRaw(this, 'nome') as string;
  }
  get createdAt(): Date {
    return new Date(getRaw(this, 'created_at') as number);
  }
  get updatedAt(): Date {
    return new Date(getRaw(this, 'updated_at') as number);
  }
}
