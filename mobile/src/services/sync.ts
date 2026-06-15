import { Q } from '@nozbe/watermelondb';
import { synchronize } from '@nozbe/watermelondb/sync';
import { collections, database } from '../database';
import type FotoRegistro from '../database/models/FotoRegistro';
import type Registro from '../database/models/Registro';
import { api } from './api';
import { isOnline } from './network';

/**
 * Envia para o backend as fotos que ainda nao tem remote_url.
 * O arquivo fica salvo localmente (local_path); aqui subimos os bytes e
 * gravamos a URL remota retornada, para que o /sync/push leve essa URL.
 */
async function uploadPendingPhotos() {
  const pendentes = await collections.fotoRegistros
    .query(Q.where('remote_url', Q.eq(null)), Q.where('local_path', Q.notEq(null)))
    .fetch();

  for (const foto of pendentes as FotoRegistro[]) {
    if (!foto.localPath) continue;
    try {
      const { url } = await api.uploadFoto(foto.localPath, foto.id, foto.registroId);
      await database.write(async () => {
        await foto.update((f) => {
          f.remoteUrl = url;
        });
      });
    } catch (err) {
      // Se falhar o upload de uma foto, seguimos com as demais.
      console.warn('[sync] Falha no upload de foto', foto.id, (err as Error).message);
    }
  }
}

/** Marca todos os registros com determinado status (uso interno). */
async function marcarRegistros(de: string[], para: 'synced' | 'error') {
  const registros = (await collections.registros
    .query(Q.where('sync_status', Q.oneOf(de)))
    .fetch()) as Registro[];
  if (registros.length === 0) return;
  await database.write(async () => {
    await database.batch(
      registros.map((r) =>
        r.prepareUpdate((rec) => {
          rec.syncState = para;
        }),
      ),
    );
  });
}

/**
 * Sincronizacao completa (pull + push) compativel com o WatermelonDB.
 * Lanca erro se estiver offline ou se a comunicacao falhar.
 */
export async function runSync() {
  if (!(await isOnline())) {
    throw new Error('Sem conexao com a internet');
  }

  try {
    // 1) Sobe as fotos pendentes para obter a remote_url.
    await uploadPendingPhotos();

    // 2) Pull + push das tabelas.
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        const data = await api.get(`/sync/pull?lastPulledAt=${lastPulledAt ?? 0}`);
        return { changes: data.changes, timestamp: data.timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        await api.post('/sync/push', { changes, lastPulledAt });
      },
      migrationsEnabledAtVersion: 1,
    });

    // 3) Atualiza o status visual dos registros para "synced".
    await marcarRegistros(['pending', 'error'], 'synced');
  } catch (err) {
    // Marca como erro os que continuam pendentes, para sinalizar na lista.
    await marcarRegistros(['pending'], 'error');
    throw err;
  }
}
