# WatermelonDB e a Sincronização Offline — Documento Técnico

Este documento explica, em detalhes técnicos, **como o WatermelonDB é usado no app mobile**
e **como funciona a sincronização offline** com o backend (Express + MySQL).

> Arquivos citados estão em `mobile/src/`. O backend correspondente está em `backend/src/`.

---

## 1. Por que WatermelonDB?

O WatermelonDB é um banco **local, reativo e offline-first** para React Native, construído
sobre **SQLite**. Características que motivam o uso aqui:

- **Offline-first:** todas as leituras/escritas acontecem no SQLite local. O app funciona
  100% sem internet; a rede só é usada na sincronização.
- **Reativo:** consultas (`query().observe()`) emitem novos resultados automaticamente quando
  os dados mudam — a UI se atualiza sozinha, sem `setState` manual.
- **Lazy/performático:** os registros são carregados sob demanda; lida bem com milhares de linhas.
- **Protocolo de sync embutido:** a função `synchronize()` implementa o algoritmo de
  *pull/push* incremental, bastando o backend responder no formato esperado.

> Observação: o WatermelonDB é um **módulo nativo** (SQLite). Por isso o projeto é *bare workflow*
> (pastas `android/` e `ios/`) e **não roda no Expo Go** — precisa de um *development build*.

---

## 2. Camadas do WatermelonDB neste app

```
mobile/src/database/
├── index.ts        # cria o Adapter (SQLite) e a Database; expõe as collections
├── schema.ts       # definição das tabelas e colunas locais
├── migrations.ts   # migrações de schema (versionamento)
└── models/         # uma classe por tabela (Empresa, Usuario, Registro, FotoRegistro)
    └── _raw.ts     # helpers _getRaw/_setRaw (ver seção 4)
```

### 2.1 Adapter + Database (`database/index.ts`)

```ts
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: false,        // usa a ponte assíncrona (compatível com RN 0.85 / nova arquitetura)
  dbName: 'testeMobile',
});

export const database = new Database({
  adapter,
  modelClasses: [Empresa, Usuario, Registro, FotoRegistro],
});
```

- **`SQLiteAdapter`** é a ponte entre o JS e o SQLite nativo.
- **`jsi: false`** usa o módulo nativo `nozbe_watermelondb` por *bridge*. (O modo `jsi: true` é
  mais rápido, mas o wiring nativo do plugin não é compatível com o RN 0.85 deste projeto.)
- **`Database`** registra os *model classes* e dá acesso às *collections*
  (`database.get('registros')`, etc.).

### 2.2 Schema (`database/schema.ts`)

O schema declara as 4 tabelas locais com **os mesmos nomes de coluna que o backend devolve no
sync** — isso é o que permite a sincronização funcionar sem mapeamento extra.

```ts
tableSchema({
  name: 'registros',
  columns: [
    { name: 'empresa_id', type: 'number' },
    { name: 'usuario_id', type: 'number' },
    { name: 'tipo', type: 'string' },
    { name: 'data_hora', type: 'number' },     // epoch em ms
    { name: 'descricao', type: 'string' },
    { name: 'sync_status', type: 'string' },    // pending | synced | error
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
}),
```

Pontos importantes do schema:

- **Datas como `number` (epoch em ms):** `created_at`, `updated_at` e `data_hora` são números.
  O WatermelonDB trabalha nativamente com timestamps; o backend converte para/de `DATETIME`
  do MySQL (`backend/src/utils/time.ts`).
- **`id` é sempre string:** o WatermelonDB gera ids string aleatórios. Por isso, no MySQL,
  `registro.id` e `foto_registro.id` são `VARCHAR(36)` — o mesmo id criado offline no app é o
  usado no servidor (essencial para o push não duplicar).
- **`sync_status`** é uma coluna *local* (não existe no MySQL) usada só para exibir o estado
  de cada registro na lista.

### 2.3 Migrations (`database/migrations.ts`)

Começa vazio (versão 1). **Regra:** ao mudar colunas, incremente `version` em `schema.ts` **e**
adicione um passo em `migrations.ts`. Sem isso o app quebra ao abrir um banco antigo.

---

## 3. Colunas internas do WatermelonDB (`_status` e `_changed`)

Além das colunas do schema, cada linha tem campos internos que o WatermelonDB gerencia sozinho:

- **`_status`**: `'created'`, `'updated'`, `'deleted'` ou `'synced'`. Marca o que ainda **não**
  foi enviado ao servidor. É a base do algoritmo de push.
- **`_changed`**: lista de colunas alteradas desde a última sincronização (para enviar *diffs*).

Quando você cria/edita um registro localmente, o `_status` vira `created`/`updated`. Após um
`synchronize()` bem-sucedido, o WatermelonDB marca tudo como `synced` automaticamente.

> Neste app mantemos **também** uma coluna própria `sync_status` (pending/synced/error) para o
> rótulo na UI, porque é simples de ler e exibir. Os dois conceitos convivem (ver seção 6).

---

## 4. Models sem decorators (decisão técnica)

A forma idiomática do WatermelonDB usa **decorators** (`@field`, `@date`). Porém, no **Expo SDK 56
(React Native 0.85)**, os decorators legados quebram em tempo de bundle/runtime:

> `Decorating class property failed. Please ensure that transform-class-properties is enabled
> and runs after the decorators transform.`

Isso ocorre porque os decorators exigem o transform de *class-properties* em modo `loose`, que o
`babel-preset-expo` do SDK 56 não usa — e não há como habilitar `loose` só para os models sem
efeitos colaterais (global quebra o RN; `.babelrc`/`overrides` quebram o Metro/expo-router).

**Solução adotada:** definir os campos como **getters/setters** que chamam `_getRaw`/`_setRaw`
(o mesmo que os decorators gerariam internamente). Helper em `models/_raw.ts`:

```ts
export function getRaw(model, column) { return model._getRaw(column); }
export function setRaw(model, column, value) { model._setRaw(column, value); }
```

Exemplo (`models/Registro.ts`):

```ts
export default class Registro extends Model {
  static table = 'registros';
  static associations = associations(['foto_registros', { type: 'has_many', foreignKey: 'registro_id' }]);

  get tipo(): TipoRegistro { return getRaw(this, 'tipo') as TipoRegistro; }
  set tipo(v: TipoRegistro) { setRaw(this, 'tipo', v); }

  get dataHora(): Date { return new Date(getRaw(this, 'data_hora') as number); }
  set dataHora(v: Date) { setRaw(this, 'data_hora', v ? v.getTime() : null); }

  get fotos(): Query<FotoRegistro> {
    return this.collections.get<FotoRegistro>('foto_registros').query(Q.where('registro_id', this.id));
  }
}
```

Funciona exatamente como os decorators (acesso pela coluna crua + conversão de tipos), mas sem
depender da configuração de Babel.

---

## 5. Como o offline funciona (sem rede)

### 5.1 Criar um registro (`features/registros/services/registroService.ts`)

```ts
await database.write(async () => {
  const registro = await collections.registros.create((r) => {
    r.empresaId = user.empresa_id;
    r.usuarioId = user.id;
    r.tipo = input.tipo;
    r.dataHora = input.dataHora;
    r.descricao = input.descricao;
    r.syncState = 'pending';      // marcador visual
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
```

- **Toda escrita acontece dentro de `database.write(...)`** (transação obrigatória do WatermelonDB).
- O registro nasce com `_status = 'created'` (interno) e `sync_status = 'pending'` (visual).
- **Fotos:** os arquivos são copiados para `FileSystem.documentDirectory/fotos/` (diretório
  permanente do app), garantindo que continuem disponíveis offline e após reiniciar o app.
  Só o caminho local (`local_path`) é gravado agora; o upload acontece no sync.
- Nada disso precisa de internet.

### 5.2 Listar reativamente (`features/registros/hooks/useRegistros.ts`)

```ts
const subscription = collections.registros
  .query(Q.sortBy('data_hora', Q.desc))
  .observe()
  .subscribe(setRegistros);
```

A lista lê **do banco local** e se atualiza sozinha: ao criar um registro ou ao terminar um sync,
o `observe()` emite a nova lista e a UI re-renderiza. A UI **nunca** depende de uma chamada de
rede para mostrar dados.

---

## 6. Sincronização offline → online

A sincronização usa a função `synchronize()` do WatermelonDB, orquestrada em
`services/sync.ts` (`runSync()`), disparada pelo botão **Sincronizar** ou automaticamente quando
a internet volta (`useSync` + NetInfo).

### 6.1 Ordem das etapas (`runSync`)

```
1. isOnline()                -> se offline, lança erro amigável
2. uploadPendingPhotos()     -> envia as fotos sem remote_url, grava a URL retornada
3. synchronize({ pullChanges, pushChanges })   -> pull + push
4. marcarRegistros(...)      -> atualiza o sync_status visual (pending/error -> synced)
```

As fotos são enviadas **antes** do `synchronize()` para que o `push` já leve a `remote_url`.

### 6.2 O algoritmo `synchronize()`

```ts
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
```

Como funciona internamente:

1. **Pull:** o WatermelonDB chama `pullChanges` passando o `lastPulledAt` (timestamp da última
   sincronização, guardado por ele). O servidor devolve só o que mudou desde então e um novo
   `timestamp`. O WatermelonDB aplica esses dados no SQLite local (sem marcar como "para enviar").
2. **Push:** o WatermelonDB coleta tudo que está `_status != synced` (criado/editado/apagado
   offline), monta o objeto `changes` e chama `pushChanges`. Se a chamada não lançar erro, ele
   marca esses registros como `synced` internamente.
3. O novo `timestamp` vira o `lastPulledAt` da próxima vez.

### 6.3 Formato dos dados (`changes`)

Tanto o pull quanto o push usam o mesmo formato, por tabela, com três "baldes":

```json
{
  "changes": {
    "registros": {
      "created": [ { "id": "...", "empresa_id": 1, "tipo": "COMPRA", "data_hora": 1710000000000, ... } ],
      "updated": [ ],
      "deleted": [ "id-apagado-1" ]
    },
    "foto_registros": { "created": [], "updated": [], "deleted": [] }
  },
  "timestamp": 1710000000000
}
```

- `created`/`updated`: objetos completos com `id` + colunas (datas em **epoch ms**).
- `deleted`: apenas a lista de `id`s.

### 6.4 Lado do servidor — PULL (`backend/src/services/sync.service.ts`)

O `GET /sync/pull?lastPulledAt=ms`:

- Filtra **sempre** pela empresa do usuário do token (multi-tenant). A empresa Alpha nunca recebe
  dados da Beta.
- Se `lastPulledAt = 0` (primeira vez): devolve todos os dados não-apagados da empresa em `created`.
- Se `lastPulledAt > 0`: devolve só linhas com `updated_at > lastPulledAt`, distribuídas em:
  - `deleted` → se `deleted_at` preenchido (soft delete),
  - `created` → se `created_at > lastPulledAt`,
  - `updated` → caso contrário.
- Converte `DATETIME` (MySQL) → epoch ms (esperado pelo WatermelonDB).
- Para `registros`, injeta `sync_status: 'synced'` (tudo que vem do servidor já está sincronizado).

### 6.5 Lado do servidor — PUSH

O `POST /sync/push` recebe os `changes` de `registros` e `foto_registros` e, numa **transação**:

- **Nunca confia no `empresa_id`/`usuario_id` enviados pelo app** — grava sempre os do token.
- `created`/`updated` → *upsert* (INSERT ou UPDATE) usando o `id` enviado.
- `deleted` → *soft delete* (`deleted_at = agora`).
- **Checa propriedade:** um registro só pode ser alterado/apagado se for da mesma empresa do
  usuário (`assertOwnership`); caso contrário, a transação falha.
- Converte epoch ms → `DATETIME` e valida o `tipo` (`COMPRA`/`VENDA`).

### 6.6 sync_status visual (pending / synced / error)

Independente do `_status` interno do WatermelonDB, mantemos a coluna `sync_status` para o rótulo
da lista:

- Criação → `pending`.
- Após `synchronize()` ok → `marcarRegistros(['pending','error'], 'synced')`.
- Se o sync falhar → `marcarRegistros(['pending'], 'error')` e um aviso amigável é exibido.

---

## 7. Fluxo das fotos no sync

1. Offline: a foto é copiada para o diretório do app; cria-se uma linha `foto_registros` com
   `local_path` preenchido e `remote_url` nula.
2. No sync, `uploadPendingPhotos()` busca fotos com `remote_url` nula + `local_path` presente,
   envia o arquivo via `POST /uploads/fotos` (multipart) e grava a `remote_url` retornada
   localmente.
3. Em seguida, o `synchronize()` envia a linha `foto_registros` (agora com `remote_url`) ao
   servidor pelo push. O backend também associa a `remote_url` ao registro quando recebe o
   `foto_id` no upload.

---

## 8. Resumo do caminho de um dado (offline → MySQL)

```
[Usuário cria registro no app]
        │  database.write -> collections.registros.create(...)
        ▼
[SQLite local]  registro  _status=created  sync_status=pending
        │  (UI atualiza via observe(), sem rede)
        ▼
[Toca "Sincronizar"]  runSync()
        │  1) uploadPendingPhotos -> POST /uploads/fotos  (grava remote_url)
        │  2) synchronize():
        │       pull  GET /sync/pull?lastPulledAt=...
        │       push  POST /sync/push  { changes }
        ▼
[Backend Express]  força empresa_id/usuario_id do token, valida tipo, transação
        ▼
[MySQL]  INSERT/UPDATE em registro/foto_registro
        ▲
        │  pull seguinte traz alterações de outros dispositivos da MESMA empresa
[SQLite local]  _status=synced  +  sync_status=synced  (badge "Sincronizado")
```

---

## 9. Garantias e limitações

**Garantias**
- Funciona offline (criar/editar/anexar fotos) e sincroniza quando há rede.
- Isolamento por empresa garantido no servidor (pull filtra; push força os ids do token).
- Ids consistentes entre app e servidor (string gerada pelo WatermelonDB).
- Soft delete propagado pelo sync (`deleted_at`).

**Limitações / melhorias possíveis**
- Resolução de conflitos é a padrão do WatermelonDB (last-write-wins por coluna). Para regras de
  negócio específicas, seria preciso lógica extra no servidor.
- Sem paginação no pull — para bases muito grandes, convém paginar.
- Sem retry/backoff automático em falhas parciais de upload de foto (hoje segue para as demais).
- Token sem renovação automática (expira conforme `JWT_EXPIRES_IN`).
