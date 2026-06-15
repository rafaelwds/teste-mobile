import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '@/features/auth/hooks/useSession';

/**
 * Rota inicial: decide para onde mandar o usuario.
 * - Enquanto carrega a sessao salva, mostra um loading.
 * - Com sessao -> /registros. Sem sessao -> /login.
 */
export default function Index() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={session ? '/registros' : '/login'} />;
}
