import { api } from '../../../services/api';
import type { Session } from '../../../types';

/** Faz login no backend e devolve token + dados do usuario. */
export async function loginRequest(login: string, senha: string): Promise<Session> {
  const data = await api.post('/auth/login', { login, senha });
  return { token: data.token, user: data.user };
}

/** Busca os dados do usuario autenticado (valida o token). */
export async function meRequest() {
  const data = await api.get('/auth/me');
  return data.user;
}
