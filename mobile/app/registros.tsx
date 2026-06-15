import { Redirect } from 'expo-router';
import { RegistrosScreen } from '@/features/registros/screens/RegistrosScreen';
import { useSession } from '@/features/auth/hooks/useSession';

export default function Registros() {
  const { session, loading } = useSession();
  // Protege a rota: sem sessao volta para o login.
  if (!loading && !session) return <Redirect href="/login" />;
  if (!session) return null;
  return <RegistrosScreen />;
}
