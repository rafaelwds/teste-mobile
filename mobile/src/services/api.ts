import { API_URL } from '../config';

/**
 * Cliente HTTP minimo baseado em fetch.
 * Mantem o token em memoria e o injeta no header Authorization.
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getApiUrl() {
  return API_URL;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

async function handle(res: Response) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error ?? `Erro HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  async get(path: string) {
    const res = await fetch(`${API_URL}${path}`, { headers: buildHeaders() });
    return handle(res);
  },

  async post(path: string, body: unknown) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    return handle(res);
  },

  /** Upload multipart de uma foto. */
  async uploadFoto(fileUri: string, fotoId: string, registroId: string) {
    const form = new FormData();
    const name = fileUri.split('/').pop() ?? `${fotoId}.jpg`;
    // @ts-expect-error: formato aceito pelo React Native para upload de arquivo
    form.append('foto', { uri: fileUri, name, type: 'image/jpeg' });
    form.append('foto_id', fotoId);
    form.append('registro_id', registroId);

    const res = await fetch(`${API_URL}/uploads/fotos`, {
      method: 'POST',
      headers: buildHeaders(),
      body: form,
    });
    return handle(res) as Promise<{ url: string; path: string; filename: string }>;
  },
};
