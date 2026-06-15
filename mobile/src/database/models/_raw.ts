import type { Model } from '@nozbe/watermelondb';

/**
 * Helpers para ler/gravar colunas cruas do WatermelonDB.
 *
 * Em vez de usar os decorators (@field/@date), que dependem de uma configuracao
 * especifica de Babel (class-properties em modo "loose") incompativel com o
 * babel-preset-expo do SDK 56, definimos os campos como getters/setters que
 * chamam _getRaw/_setRaw — exatamente o que os decorators geram internamente.
 */
export type Raw = string | number | boolean | null;

export function getRaw(model: Model, column: string): Raw {
  return (model as unknown as { _getRaw: (c: string) => Raw })._getRaw(column);
}

export function setRaw(model: Model, column: string, value: Raw): void {
  (model as unknown as { _setRaw: (c: string, v: Raw) => void })._setRaw(column, value);
}
