import { MigrationInterface, QueryRunner } from "typeorm";

export class DenormalizeCounterparty1791974311574 implements MigrationInterface {
    name = 'DenormalizeCounterparty1791974311574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "email" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "account" a SET "email" = u."email" FROM "user" u WHERE u."id"::text = a."userId"`);
        await queryRunner.query(`ALTER TABLE "account" ALTER COLUMN "email" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD "toEmail" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "transfer" t SET "toEmail" = a."email" FROM "account" a WHERE a."id"::text = t."toAccountId"`);
        await queryRunner.query(`CREATE INDEX "IDX_4c8f96ccf523e9a3faefd5bdd4" ON "account" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4c8f96ccf523e9a3faefd5bdd4"`);
        await queryRunner.query(`ALTER TABLE "transfer" DROP COLUMN "toEmail"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "email"`);
    }

}
