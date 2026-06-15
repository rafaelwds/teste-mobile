import { Q } from '@nozbe/watermelondb';
import { useEffect, useState } from 'react';
import { collections } from '../../../database';
import type Registro from '../../../database/models/Registro';

/**
 * Hook reativo: devolve a lista de registros locais (mais recentes primeiro).
 * A lista se atualiza sozinha quando o WatermelonDB muda (criar/sincronizar).
 */
export function useRegistros(): Registro[] {
  const [registros, setRegistros] = useState<Registro[]>([]);

  useEffect(() => {
    const subscription = collections.registros
      .query(Q.sortBy('data_hora', Q.desc))
      .observe()
      .subscribe(setRegistros);
    return () => subscription.unsubscribe();
  }, []);

  return registros;
}

/** Hook reativo para a quantidade de fotos de um registro. */
export function useFotoCount(registro: Registro): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const subscription = registro.fotos.observeCount().subscribe(setCount);
    return () => subscription.unsubscribe();
  }, [registro.id]);

  return count;
}
