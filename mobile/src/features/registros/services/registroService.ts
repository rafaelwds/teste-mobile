import * as FileSystem from 'expo-file-system/legacy';
import { collections, database } from '../../../database';
import type { SessionUser, TipoRegistro } from '../../../types';

const PHOTO_DIR = `${FileSystem.documentDirectory}fotos/`;

/**
 * Copia a foto escolhida (galeria/camera) para um diretorio permanente do app,
 * para que ela continue disponivel offline e apos reiniciar o app.
 */
async function persistPhoto(uri: string): Promise<string> {
  try {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  } catch {
    // diretorio ja existe
  }
  const ext = (uri.split('.').pop() ?? 'jpg').split('?')[0];
  const dest = `${PHOTO_DIR}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export interface NovoRegistroInput {
  tipo: TipoRegistro;
  dataHora: Date;
  descricao: string;
  fotos: string[]; // URIs das fotos escolhidas
}

/**
 * Cria um registro + suas fotos no WatermelonDB (funciona 100% offline).
 * empresa_id e usuario_id vem da sessao; sync_status inicia como 'pending'.
 */
export async function createRegistro(input: NovoRegistroInput, user: SessionUser) {
  // Persiste os arquivos antes de abrir a transacao do banco.
  const localPaths: string[] = [];
  for (const uri of input.fotos) {
    localPaths.push(await persistPhoto(uri));
  }

  await database.write(async () => {
    const registro = await collections.registros.create((r) => {
      r.empresaId = user.empresa_id;
      r.usuarioId = user.id;
      r.tipo = input.tipo;
      r.dataHora = input.dataHora;
      r.descricao = input.descricao;
      r.syncState = 'pending';
    });

    for (const localPath of localPaths) {
      await collections.fotoRegistros.create((f) => {
        f.registroId = registro.id;
        f.empresaId = user.empresa_id;
        f.usuarioId = user.id;
        f.localPath = localPath;
      });
    }
  });
}
