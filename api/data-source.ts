import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/wallet',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
