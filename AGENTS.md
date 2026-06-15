# AGENTS.md — Orientacoes para agentes de IA

Guia para quem (humano ou IA) for evoluir este monorepo sem quebrar o que ja funciona.

## Visao geral da arquitetura

- **Monorepo** com duas pastas independentes: `backend/` e `mobile/`.
- **Backend:** Node + Express + TypeScript, MySQL, JWT. Organizado em
  `config / middleware / routes / services / utils`. Regra de negocio fica em `services`.
- **Mobile:** Expo SDK 56 (bare), TypeScript, Expo Router, WatermelonDB.
  Organizado **por feature** em `src/features/<feature>/{services,hooks,components,screens}`.
- **Estilo:** sempre `StyleSheet.create`. Nao introduzir Tailwind/NativeWind/styled-components.
- **TypeScript** em tudo. Rode `tsc --noEmit` antes de finalizar (backend e mobile).

## Contrato de sincronizacao (NAO quebrar)

O app e o backend conversam pelo protocolo do WatermelonDB. Mudou um lado, mude o outro.

- Tabelas sincronizadas: `empresas`, `usuarios`, `registros`, `foto_registros`.
- Os **nomes de colunas** no schema do WatermelonDB (`mobile/src/database/schema.ts`)
  devem bater com o JSON retornado pelo backend em `/sync/pull` e aceito em `/sync/push`.
- `created_at` / `updated_at` / `data_hora` trafegam como **numero (epoch ms)**.
  No MySQL sao `DATETIME` — a conversao esta em `backend/src/utils/time.ts`.
- O pull divide as linhas em `created` / `updated` / `deleted`. O push recebe o mesmo formato.

## Regras para NAO quebrar o WatermelonDB

- Ao adicionar/alterar colunas: **incremente a `version`** em `schema.ts` **e** adicione
  um passo em `migrations.ts`. Nunca altere o schema sem migration.
- Models usam **decorators legados** — `babel.config.js` tem `@babel/plugin-proposal-decorators`
  e `tsconfig.json` tem `experimentalDecorators: true`. Nao remover.
- Nao use o nome de propriedade `syncStatus` num Model (ja existe no WatermelonDB).
  Aqui a coluna `sync_status` e mapeada para a propriedade `syncState`.
- Toda escrita no banco roda dentro de `database.write(async () => { ... })`.
- O setup nativo do WatermelonDB depende de:
  - `app.json` -> plugin `@morrowdigital/watermelondb-expo-plugin` (habilita JSI).
  - `react-native.config.js` -> desabilita o autolink do `@nozbe/simdjson` (evita pod duplicado).
  - adapter com `jsi: true` em `src/database/index.ts`.
  Nao remova esses itens sem entender o impacto no `pod install` / build Android.

## Regras para manter o offline

- O app **deve funcionar sem internet**: criar/editar registros e anexar fotos offline.
- Nunca faca a UI depender de chamada de rede para exibir a lista — ela le do WatermelonDB.
- Fotos sao copiadas para `FileSystem.documentDirectory` (persistem offline) e so enviadas
  no sync. O upload acontece **antes** do `push` para gravar `remote_url`.
- A deteccao de conexao usa `@react-native-community/netinfo` (`src/services/network.ts`).

## Regras para o backend

- **Seguranca multi-empresa (critico):**
  - No `pull`, filtrar SEMPRE pela empresa do token. Nunca vazar dados de outra empresa.
  - No `push`, gravar `empresa_id` e `usuario_id` **a partir do token**, ignorando o que o app enviar.
  - Update/delete so e permitido em registros da mesma empresa (ver `assertOwnership`).
- Senha sempre com **bcrypt**; nunca retornar `senha` em resposta.
- Endpoints de `sync` e `uploads` protegidos por `authMiddleware`.
- Variaveis sensiveis no `.env` (nunca commitar `.env`).
- Validacao basica de input em todas as rotas.

## Regras para o mobile

- Componentes simples e funcionais; nada de libs visuais pesadas.
- Validacoes do formulario: tipo e data obrigatorios; descricao obrigatoria com **min. 10 caracteres**.
- Tipos salvos internamente como `COMPRA` / `VENDA`.
- Mensagens de erro amigaveis (Alert).

## Checklist antes de finalizar

- [ ] `cd backend && npx tsc --noEmit` passa.
- [ ] `cd mobile && npx tsc --noEmit` passa.
- [ ] Mudou schema do WatermelonDB? Versao + migration atualizadas.
- [ ] Mudou o contrato de sync? Backend e mobile ajustados juntos.
- [ ] Backend ainda forca `empresa_id`/`usuario_id` pelo token.
- [ ] Nenhuma senha exposta em respostas/logs.
- [ ] App continua funcionando offline (lista le do banco local).
- [ ] Nao introduziu Tailwind/NativeWind/styled-components.
- [ ] `.env` nao foi commitado.
