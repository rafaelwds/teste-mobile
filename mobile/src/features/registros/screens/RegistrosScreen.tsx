import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../auth/hooks/useSession';
import { RegistroForm } from '../components/RegistroForm';
import { RegistroItem } from '../components/RegistroItem';
import { useRegistros } from '../hooks/useRegistros';
import { useSync } from '../hooks/useSync';

export function RegistrosScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useSession();
  const registros = useRegistros();
  const { syncing, online, sync } = useSync();
  const [erroSync, setErroSync] = useState<string | null>(null);

  const user = session!.user;

  async function sincronizar() {
    setErroSync(null);
    try {
      await sync();
      Alert.alert('Sincronizacao', 'Dados sincronizados com sucesso.');
    } catch (err) {
      setErroSync((err as Error).message);
      Alert.alert('Falha na sincronizacao', (err as Error).message);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Ola, {user.nome}</Text>
          <Text style={styles.empresa}>
            Empresa #{user.empresa_id} · {online ? 'Online' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logout} onPress={signOut}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.syncBtn, (syncing || !online) && styles.syncBtnDisabled]}
        onPress={sincronizar}
        disabled={syncing || !online}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.syncText}>{online ? 'Sincronizar' : 'Sem conexao'}</Text>
        )}
      </TouchableOpacity>
      {erroSync && <Text style={styles.erro}>{erroSync}</Text>}

      <FlatList
        data={registros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RegistroItem registro={item} />}
        ListHeaderComponent={<RegistroForm user={user} />}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum registro ainda. Crie o primeiro acima.</Text>
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  topbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hello: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  empresa: { fontSize: 13, color: '#64748b', marginTop: 2 },
  logout: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: '#0f172a', fontWeight: '600' },
  syncBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  erro: { color: '#dc2626', marginBottom: 8, fontSize: 13 },
  list: { paddingBottom: 40 },
  vazio: { textAlign: 'center', color: '#64748b', marginTop: 24 },
});
