import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1715000000000 implements MigrationInterface {
  name = 'Init1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "balance" bigint NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'EUR', CONSTRAINT "UQ_60328bf27019ff5498c4b977421" UNIQUE ("userId"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transfer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fromAccountId" character varying NOT NULL, "toAccountId" character varying NOT NULL, "amount" bigint NOT NULL, "idempotencyKey" character varying NOT NULL, "createdAt" timestamp NOT NULL DEFAULT now(), CONSTRAINT "UQ_5a3a52379993f60685c031e5c9a" UNIQUE ("fromAccountId", "idempotencyKey"), CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transfer_from_createdAt" ON "transfer" ("fromAccountId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transfer_to_createdAt" ON "transfer" ("toAccountId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_entry" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transferId" character varying NOT NULL, "accountId" character varying NOT NULL, "amount" bigint NOT NULL, "createdAt" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_04e9d274911f909a5848a15cd74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ledger_account_createdAt" ON "ledger_entry" ("accountId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ledger_entry"`);
    await queryRunner.query(`DROP TABLE "transfer"`);
    await queryRunner.query(`DROP TABLE "account"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
