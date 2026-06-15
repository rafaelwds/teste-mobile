import { Platform } from 'react-native';

/**
 * URL base da API.
 *
 * - Emulador Android: "localhost" aponta para o proprio emulador, entao use 10.0.2.2.
 * - Simulador iOS: pode usar localhost.
 * - Dispositivo fisico: troque por http://SEU_IP_LOCAL:3333 (ex.: http://192.168.0.10:3333)
 *   e use o mesmo IP em PUBLIC_URL no backend/.env.
 */
const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3333',
  ios: 'http://localhost:3333',
  default: 'http://localhost:3333',
});

export const API_URL = DEFAULT_API_URL as string;
