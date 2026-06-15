/**
 * Helpers de conversao de tempo.
 *
 * O WatermelonDB trabalha com timestamps em milissegundos (number).
 * O MySQL guarda DATETIME como string "YYYY-MM-DD HH:MM:SS".
 * Estas funcoes convertem entre os dois formatos.
 */

/** Converte uma string DATETIME do MySQL (UTC) para epoch em ms. */
export function mysqlToEpoch(value: string | null): number | null {
  if (!value) return null;
  // O driver retorna no formato "YYYY-MM-DD HH:MM:SS". Tratamos como UTC.
  return new Date(value.replace(' ', 'T') + 'Z').getTime();
}

/** Converte epoch em ms (ou ISO) para string DATETIME do MySQL em UTC. */
export function epochToMysql(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/** Agora em ms. */
export function nowEpoch(): number {
  return Date.now();
}

/** Agora em string DATETIME do MySQL (UTC). */
export function nowMysql(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
