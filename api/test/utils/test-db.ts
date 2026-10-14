import { DataSource } from 'typeorm';
import { execFileSync } from 'child_process';

const ADMIN_URL = process.env.TEST_ADMIN_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';
export const DATABASE_NAME = 'wallet_e2e';
export const DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? `postgres://postgres:postgres@localhost:5432/${DATABASE_NAME}`;

function psql(url: string, sql: string) {
  execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-c', sql], { stdio: 'ignore' });
}

export function resetDatabase() {
  psql(ADMIN_URL, `DROP DATABASE IF EXISTS ${DATABASE_NAME} WITH (FORCE)`);
  psql(ADMIN_URL, `CREATE DATABASE ${DATABASE_NAME}`);
}

export async function recreateSchema(ds: DataSource) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await ds.query('SELECT 1');
      await ds.runMigrations();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  throw lastError;
}
