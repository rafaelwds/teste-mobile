export type TipoRegistro = 'COMPRA' | 'VENDA';

export type SyncStatus = 'pending' | 'synced' | 'error';

export interface SessionUser {
  id: number;
  nome: string;
  login: string;
  empresa_id: number;
}

export interface Session {
  token: string;
  user: SessionUser;
}
