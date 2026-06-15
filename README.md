# Teste Mobile — Monorepo

Teste tecnico de aplicativo mobile **offline-first** com sincronizacao.

- **Mobile:** React Native + **Expo SDK 56** (bare workflow, com `android/` e `ios/`), TypeScript, **WatermelonDB**
- **Backend:** Node.js + Express + TypeScript, **MySQL**, autenticacao JWT
- **Estilo:** `StyleSheet` do React Native (sem Tailwind/NativeWind/styled-components)
- **Arquitetura:** organizada por features, simples de entender e rodar

```
teste-mobile/
├── backend/        # API REST + MySQL
├── mobile/         # App Expo (bare) + WatermelonDB
├── README.md       # este arquivo
├── AGENTS.md       # orientacoes para agentes de IA
└── FUNCIONAMENTO.txt  # explicacao detalhada do funcionamento
```

---

## 1. Requisitos

| Ferramenta        | Observacao                                              |
| ----------------- | ------------------------------------------------------ |
| Node.js 18+       | Testado no 22                                          |
| MySQL 5.7+ ou 8+  | Banco remoto                                           |
| Android Studio    | Emulador Android (para rodar o app)                    |
| Xcode (opcional)  | Apenas em macOS, para rodar no iOS                     |
| Ruby >= 2.7       | Apenas iOS, para o `pod install`                       |

> O app **NAO roda no Expo Go** (usa modulo nativo WatermelonDB). Use um
> *development build* via `npm run android` ou `npm run ios`.

---

## 2. Rodar o backend + MySQL

**Opcao A — MySQL via Docker (recomendado):** sobe um MySQL pronto na porta `3307`
(evita conflito com um MySQL ja existente na 3306). O `backend/.env.example` ja aponta para ele.

```bash
# na raiz do monorepo
docker compose up -d        # sobe o MySQL (porta 3307, user root / senha root)

cd backend
npm install
cp .env.example .env        # ja vem configurado para o Docker da raiz
npm run migrate             # cria o banco e as tabelas
npm run seed                # insere empresas e usuarios de teste
npm run dev                 # sobe a API em http://localhost:3333
```

**Opcao B — MySQL proprio:** edite `backend/.env` com seu host/porta/usuario/senha
e rode `npm run migrate && npm run seed && npm run dev`.

Teste rapido:

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"joao@alpha.com","senha":"123456"}'
```

Detalhes em [`backend/README.md`](backend/README.md).

---

## 3. Rodar o app mobile

```bash
cd mobile
npm install
# ajuste a URL da API em src/config.ts se necessario
npm run android             # ou: npm run ios (macOS)
```

- **Emulador Android:** a API e acessada em `http://10.0.2.2:3333` (ja configurado).
- **Device fisico:** troque por `http://SEU_IP:3333` em `mobile/src/config.ts`
  **e** em `PUBLIC_URL` no `backend/.env`.

Detalhes em [`mobile/README.md`](mobile/README.md).

---

## 4. Logins de teste

| Login            | Senha  | Empresa     |
| ---------------- | ------ | ----------- |
| joao@alpha.com   | 123456 | Alpha LTDA  |
| maria@beta.com   | 123456 | Beta LTDA   |

Cada usuario **so ve e cria** registros da propria empresa.

---

## 5. Como testar offline / online

1. Faca login (precisa de internet so na 1a vez).
2. **Ative o modo aviao** no emulador/device.
3. Crie registros de Compra/Venda, escreva a descricao (min. 10 caracteres) e anexe fotos.
   - Tudo e salvo localmente; os itens aparecem com status **Pendente**.
4. **Desligue o modo aviao** (volte a ter internet).
5. Toque em **Sincronizar** (ou aguarde a sincronizacao automatica).
   - As fotos sao enviadas e os registros passam para **Sincronizado**.
6. Confirme no MySQL que os dados chegaram:

```sql
USE teste_mobile;
SELECT id, tipo, descricao, empresa_id, usuario_id FROM registro;
SELECT id, registro_id, remote_url FROM foto_registro;
```

---

## 6. Como testar a separacao por empresa

1. Faca login com `joao@alpha.com`, crie registros e sincronize.
2. Saia (botao **Sair**) e entre com `maria@beta.com`.
3. A Maria **nao vera** os registros do Joao (empresa diferente), e vice-versa.

O backend ignora qualquer `empresa_id` enviado pelo app e usa sempre o do token.

---

## 7. Endpoints da API

| Metodo | Rota                         | Auth | Descricao                         |
| ------ | ---------------------------- | ---- | --------------------------------- |
| POST   | `/auth/login`                | Nao  | Login (retorna token + user)      |
| GET    | `/auth/me`                   | Sim  | Usuario autenticado               |
| GET    | `/sync/pull?lastPulledAt=ms` | Sim  | Mudancas do servidor              |
| POST   | `/sync/push`                 | Sim  | Aplica mudancas do app            |
| POST   | `/uploads/fotos`             | Sim  | Upload de foto (multipart)        |

---

## 8. Documentos

- [`FUNCIONAMENTO.txt`](FUNCIONAMENTO.txt) — explicacao completa de como tudo funciona.
- [`WATERMELONDB.md`](WATERMELONDB.md) — documento tecnico sobre o WatermelonDB e a sincronizacao offline.
- [`AGENTS.md`](AGENTS.md) — regras para agentes de IA trabalharem no projeto.
