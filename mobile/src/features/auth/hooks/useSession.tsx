import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { database } from '../../../database';
import { setAuthToken } from '../../../services/api';
import { clearSession, loadSession, saveSession } from '../../../storage/sessionStorage';
import type { Session } from '../../../types';
import { loginRequest } from '../services/authService';

interface SessionContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (login: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Provider que mantem a sessao do usuario.
 * Ao montar, tenta restaurar a sessao salva no AsyncStorage (login automatico).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadSession();
      if (saved) {
        setAuthToken(saved.token);
        setSession(saved);
      }
      setLoading(false);
    })();
  }, []);

  async function signIn(login: string, senha: string) {
    const newSession = await loginRequest(login, senha);
    setAuthToken(newSession.token);
    await saveSession(newSession);
    setSession(newSession);
  }

  async function signOut() {
    // Limpa o banco local para nao misturar dados entre usuarios/empresas.
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    await clearSession();
    setAuthToken(null);
    setSession(null);
  }

  const value = useMemo(
    () => ({ session, loading, signIn, signOut }),
    [session, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession deve ser usado dentro de SessionProvider');
  return ctx;
}
