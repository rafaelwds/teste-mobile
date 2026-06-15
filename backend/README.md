# Backend — Teste Mobile

API REST em **Node.js + Express + TypeScript** com **MySQL**, autenticacao **JWT** e
endpoints de **sincronizacao compativeis com o WatermelonDB**.

## Requisitos

- Node.js 18+ (testado no 22)
- MySQL 5.7+ ou 8+

## Instalacao

```bash
cd backend
npm install
cp .env.example .env   # edite com os dados do seu MySQL
```

## Configuracao (.env)

| Variavel       | Descricao                                                        |
| -------------- | ---------------------------------------------------------------- |
| `PORT`         | Porta do servidor (padrao 3333)                                  |
| `PUBLIC_URL`   | URL base para montar o link das fotos enviadas                   |
| `DB_*`         | Host, porta, usuario, senha e nome do banco MySQL                |
| `JWT_SECRET`   | Segredo usado para assinar o token                               |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `7d`)                                  |

> No emulador Android, `localhost` do celular nao e o seu PC. Use `http://10.0.2.2:3333`
> em `PUBLIC_URL` e na config do app. Em dispositivo fisico use o IP da sua maquina.

## Banco de dados (migrations e seeds)

```bash
npm run migrate   # cria o database e as tabelas
npm run seed      # insere empresas e usuarios de teste
```

## Subir o servidor

```bash
npm run dev       # modo desenvolvimento (reload automatico)
# ou
npm start         # execucao normal
```

Healthcheck: `GET http://localhost:3333/health`

## Endpoints

| Metodo | Rota                         | Auth | Descricao                              |
| ------ | ---------------------------- | ---- | -------------------------------------- |
| POST   | `/auth/login`                | Nao  | Login, retorna `{ token, user }`       |
| GET    | `/auth/me`                   | Sim  | Dados do usuario autenticado           |
| GET    | `/sync/pull?lastPulledAt=ms` | Sim  | Mudancas do servidor (apenas da empresa)|
| POST   | `/sync/push`                 | Sim  | Aplica mudancas vindas do app          |
| POST   | `/uploads/fotos`             | Sim  | Upload de foto (multipart/form-data)   |

### Exemplo de login

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"joao@alpha.com","senha":"123456"}'
```

## Seguranca / multi-empresa

- O **pull** so devolve dados da empresa do usuario do token.
- O **push** sempre grava `empresa_id`/`usuario_id` a partir do token — nunca confia no app.
- Update/delete so e permitido em registros da mesma empresa.
- Senhas sao guardadas com **bcrypt** e nunca retornadas nas respostas.

## Estrutura

```
backend/
├── src/
│   ├── config/      # env e pool de conexao MySQL
│   ├── middleware/  # auth JWT
│   ├── routes/      # auth, sync, uploads
│   ├── services/    # regra de negocio (auth, sync)
│   ├── utils/       # conversao de tempo
│   ├── app.ts       # montagem do Express
│   └── server.ts    # bootstrap
├── database/
│   ├── schema.sql   # DDL das tabelas
│   ├── migrate.ts   # cria banco + tabelas
│   └── seed.ts      # dados iniciais
└── uploads/         # fotos enviadas
```
