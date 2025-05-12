import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1747078350784 implements MigrationInterface {
    name = 'Migrations1747078350784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapters" ADD "meta_description" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chapters" ADD "keywords" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "chapters" ADD "slug" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chapters" ADD CONSTRAINT "UQ_ca1f9ef451ff9cba38945967abb" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "chapters" ADD "source_url" text`);
        await queryRunner.query(`CREATE TYPE "public"."categories_status_enum" AS ENUM('POST', 'BOOK')`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "status" "public"."categories_status_enum"`);
        await queryRunner.query(`ALTER TABLE "books" ADD "description" text`);
        await queryRunner.query(`CREATE TYPE "public"."books_status_enum" AS ENUM('NEW', 'DRAFT', 'PUBLISHED', 'CRAWLER', 'DELETED')`);
        await queryRunner.query(`ALTER TABLE "books" ADD "status" "public"."books_status_enum" NOT NULL DEFAULT 'NEW'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "books" ADD "keywords" jsonb DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_02b640f9de4714070b5fd6c024" ON "chapters" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_ca1f9ef451ff9cba38945967ab" ON "chapters" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_ce1cc7d79657a0b9abbdd995e6" ON "chapters" ("chapter_number") `);
        await queryRunner.query(`CREATE INDEX "IDX_88b5d00ccdeea13b55880af773" ON "categories" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_6957fe5d91c3d36aefe79e2c81" ON "books" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6957fe5d91c3d36aefe79e2c81"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88b5d00ccdeea13b55880af773"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce1cc7d79657a0b9abbdd995e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca1f9ef451ff9cba38945967ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02b640f9de4714070b5fd6c024"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "books" ADD "keywords" text`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."books_status_enum"`);
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."categories_status_enum"`);
        await queryRunner.query(`ALTER TABLE "chapters" DROP COLUMN "source_url"`);
        await queryRunner.query(`ALTER TABLE "chapters" DROP CONSTRAINT "UQ_ca1f9ef451ff9cba38945967abb"`);
        await queryRunner.query(`ALTER TABLE "chapters" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "chapters" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "chapters" DROP COLUMN "meta_description"`);
    }

}
