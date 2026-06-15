import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3333),
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3333}`,
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'teste_mobile',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-troque-em-producao',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
};
