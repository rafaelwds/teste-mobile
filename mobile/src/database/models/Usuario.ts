import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

export default class Usuario extends Model {
  static table = 'usuarios';

  @field('nome') nome!: string;
  @field('login') login!: string;
  @field('empresa_id') empresaId!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
