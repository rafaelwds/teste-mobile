import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

// Obs: os campos NAO usam "!" (definite assignment) de proposito — com o
// babel-preset-expo o transform de TypeScript rejeita campos "definite" que
// recebem valor via decorator. Os decorators do WatermelonDB ja definem os
// acessores, entao "strictPropertyInitialization" fica desligado no tsconfig.
export default class Empresa extends Model {
  static table = 'empresas';

  @field('nome') nome: string;
  @date('created_at') createdAt: Date;
  @date('updated_at') updatedAt: Date;
}
