import NetInfo from '@react-native-community/netinfo';

/** Retorna true se o aparelho esta com internet utilizavel. */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

/**
 * Observa mudancas de conectividade.
 * Chama o callback com true/false sempre que o estado mudar.
 * Retorna a funcao para cancelar a inscricao.
 */
export function subscribeConnectivity(cb: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => {
    cb(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
}
