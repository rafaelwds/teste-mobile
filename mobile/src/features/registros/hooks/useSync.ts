import { useCallback, useEffect, useRef, useState } from 'react';
import { runSync } from '../../../services/sync';
import { isOnline, subscribeConnectivity } from '../../../services/network';

/**
 * Hook de sincronizacao.
 * - sync(): dispara o pull+push manualmente (botao "Sincronizar").
 * - online: estado da conexao.
 * - syncing: indica loading.
 * Tambem sincroniza automaticamente quando a internet volta.
 */
export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await runSync();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    isOnline().then(setOnline);
    const unsubscribe = subscribeConnectivity((isOn) => {
      setOnline(isOn);
      // Ao reconectar, tenta sincronizar automaticamente (silencioso).
      if (isOn) sync().catch(() => undefined);
    });
    return unsubscribe;
  }, [sync]);

  return { syncing, online, sync };
}
