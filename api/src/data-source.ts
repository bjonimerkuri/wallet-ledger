import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Account } from './wallet/account.entity';
import { LedgerEntry } from './wallet/ledger-entry.entity';
import { Transfer } from './wallet/transfer.entity';
import { User } from './auth/user.entity';
import { Init1715000000000 } from './migrations/1715000000000-Init';
import { DenormalizeCounterparty1791974311574 } from './migrations/1791974311574-DenormalizeCounterparty';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/wallet',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  entities: [User, Account, Transfer, LedgerEntry],
  migrations: [Init1715000000000, DenormalizeCounterparty1791974311574],
  migrationsTableName: 'migrations',
});
