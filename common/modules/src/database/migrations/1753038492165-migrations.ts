import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1753038492165 implements MigrationInterface {
    name = 'Migrations1753038492165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "updated_by" uuid`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_c1433d71a4838793a49dcad46a" ON "roles" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5a52fc6f7a8dae64f645b0914" ON "roles" ("created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e5a52fc6f7a8dae64f645b0914"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1433d71a4838793a49dcad46a"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "created_at"`);
    }

}
