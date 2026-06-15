import { StyleSheet, Text, View } from 'react-native';
import type Registro from '../../../database/models/Registro';
import type { SyncStatus } from '../../../types';
import { formatDateTime } from '../../../utils/format';
import { useFotoCount } from '../hooks/useRegistros';

const STATUS_LABEL: Record<SyncStatus, string> = {
  pending: 'Pendente',
  synced: 'Sincronizado',
  error: 'Erro',
};

const STATUS_COLOR: Record<SyncStatus, string> = {
  pending: '#d97706',
  synced: '#16a34a',
  error: '#dc2626',
};

export function RegistroItem({ registro }: { registro: Registro }) {
  const fotoCount = useFotoCount(registro);
  const status = (registro.syncState ?? 'pending') as SyncStatus;

  return (
    <View style={styles.item}>
      <View style={styles.header}>
        <Text style={[styles.tipo, registro.tipo === 'VENDA' ? styles.venda : styles.compra]}>
          {registro.tipo === 'VENDA' ? 'Venda' : 'Compra'}
        </Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] }]}>
          <Text style={styles.badgeText}>{STATUS_LABEL[status]}</Text>
        </View>
      </View>

      <Text style={styles.data}>{formatDateTime(registro.dataHora)}</Text>
      <Text style={styles.descricao}>{registro.descricao}</Text>
      <Text style={styles.fotos}>
        {fotoCount} foto{fotoCount === 1 ? '' : 's'} anexada{fotoCount === 1 ? '' : 's'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipo: { fontSize: 16, fontWeight: '700' },
  compra: { color: '#2563eb' },
  venda: { color: '#7c3aed' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  data: { color: '#475569', marginTop: 6, fontSize: 13 },
  descricao: { color: '#0f172a', marginTop: 4, fontSize: 15 },
  fotos: { color: '#64748b', marginTop: 6, fontSize: 12 },
});
