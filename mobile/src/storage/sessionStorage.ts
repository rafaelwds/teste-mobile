import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../types';

const SESSION_KEY = '@teste_mobile/session';

/** Salva a sessao (token + user) no AsyncStorage. */
export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Le a sessao salva, ou null se nao houver. */
export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/** Remove a sessao (logout). */
export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
