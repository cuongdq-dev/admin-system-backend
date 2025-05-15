import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1747128578201 implements MigrationInterface {
    name = 'Migrations1747128578201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
    }

}
