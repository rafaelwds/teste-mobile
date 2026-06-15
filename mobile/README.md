# Mobile — Teste Mobile (Expo SDK 56, bare workflow)

App React Native (Expo SDK 56, **bare workflow** com pastas `android/` e `ios/`),
TypeScript, **WatermelonDB** offline e sincronizacao com o backend.

> **Importante:** por usar WatermelonDB (modulo nativo) o app **NAO roda no Expo Go**.
> E preciso um *development build* (`npm run android` / `npm run ios`).

## Requisitos

- Node.js 18+
- **Android:** Android Studio + um emulador (ou device com depuracao USB)
- **iOS:** macOS + **Xcode 26.1+** (a SDK 56 usa `weak let`, que exige Swift recente —
  o Xcode 26.0 falha no build do `expo-modules-jsi`) + CocoaPods (Ruby >= 2.7)
- O backend rodando (veja `../backend/README.md`)

## Instalacao

```bash
cd mobile
npm install
```

As pastas nativas ja vem geradas no repositorio. Se precisar regenerar:

```bash
npm run prebuild      # = expo prebuild --clean
```

## Configurar a URL da API

Edite [`src/config.ts`](src/config.ts):

- Emulador **Android**: `http://10.0.2.2:3333` (ja e o padrao)
- Simulador **iOS**: `http://localhost:3333`
- **Device fisico**: `http://SEU_IP_LOCAL:3333` (ex.: `http://192.168.0.10:3333`)

## Rodar

```bash
npm run android       # build + instala no emulador/dispositivo Android
# ou
npm run ios           # build + instala no simulador iOS (macOS)
```

> No iOS, se o `pod install` falhar por versao do Ruby, instale um Ruby >= 2.7
> (ex.: `brew install ruby`) e rode `cd ios && pod install`.

## Logins de teste

| Login            | Senha  | Empresa |
| ---------------- | ------ | ------- |
| joao@alpha.com   | 123456 | Alpha   |
| maria@beta.com   | 123456 | Beta    |

## Estrutura

```
mobile/
├── app/                      # rotas do Expo Router
│   ├── _layout.tsx           # providers (sessao, gesture handler, safe area)
│   ├── index.tsx             # decide login x registros
│   ├── login.tsx
│   └── registros.tsx
├── src/
│   ├── config.ts             # URL da API
│   ├── database/             # WatermelonDB (schema, models, migrations)
│   ├── features/
│   │   ├── auth/             # login, contexto de sessao
│   │   └── registros/        # form, lista, fotos, sync
│   ├── services/             # api, sync, network
│   ├── storage/              # sessao no AsyncStorage
│   ├── types/
│   └── utils/
├── android/                  # projeto nativo Android (bare)
├── ios/                      # projeto nativo iOS (bare)
└── app.json
```

## Como funciona (resumo)

- **Offline-first:** registros e fotos sao salvos no WatermelonDB local e funcionam sem internet.
- **sync_status:** cada registro mostra `Pendente`, `Sincronizado` ou `Erro` na lista.
- **Sincronizacao:** botao "Sincronizar" (ou automatica ao reconectar) faz upload das fotos,
  depois `pull` + `push` no formato do WatermelonDB.
- **Fotos:** escolhidas da galeria/camera, copiadas para o diretorio do app e enviadas no sync.
