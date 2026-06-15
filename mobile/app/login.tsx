import { Redirect } from 'expo-router';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { useSession } from '@/features/auth/hooks/useSession';

export default function Login() {
  const { session } = useSession();
  // Se ja estiver logado, vai direto para a tela principal.
  if (session) return <Redirect href="/registros" />;
  return <LoginScreen />;
}
