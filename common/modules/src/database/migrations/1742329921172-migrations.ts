import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1742329921172 implements MigrationInterface {
    name = 'Migrations1742329921172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."site_posts_indexstatus_enum" RENAME TO "site_posts_indexstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."site_posts_indexstatus_enum" AS ENUM('NEW', 'INDEXING', 'INDEXED', 'ERROR', 'DELETED')`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexStatus" TYPE "public"."site_posts_indexstatus_enum" USING "indexStatus"::"text"::"public"."site_posts_indexstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexStatus" SET DEFAULT 'NEW'`);
        await queryRunner.query(`DROP TYPE "public"."site_posts_indexstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`CREATE TYPE "public"."site_posts_indexstatus_enum_old" AS ENUM('NEW', 'INDEXED', 'DELETED', 'FALSE')`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexStatus" TYPE "public"."site_posts_indexstatus_enum_old" USING "indexStatus"::"text"::"public"."site_posts_indexstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexStatus" SET DEFAULT 'NEW'`);
        await queryRunner.query(`DROP TYPE "public"."site_posts_indexstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."site_posts_indexstatus_enum_old" RENAME TO "site_posts_indexstatus_enum"`);
    }

}
