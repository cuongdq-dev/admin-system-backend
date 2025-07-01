import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1751353352877 implements MigrationInterface {
    name = 'Migrations1751353352877'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "google_index_book_requests" ("id" SERIAL NOT NULL, "book_id" uuid NOT NULL, "site_id" uuid NOT NULL, "site_domain" text NOT NULL, "book_slug" text NOT NULL, "chapter_id" uuid, "url" text NOT NULL, "googleUrl" text NOT NULL, "type" text, "requested_at" TIMESTAMP NOT NULL DEFAULT now(), "response" jsonb DEFAULT '[]'::jsonb, CONSTRAINT "UQ_04e1984d359c8cf6d5519380b4b" UNIQUE ("book_slug", "type"), CONSTRAINT "PK_2fd269d5397f3d1f1130dbf5e17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ADD CONSTRAINT "FK_783d0356741cbac8295da3db9bc" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ADD CONSTRAINT "FK_a1aa4b95aa8a82120ba1c480700" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ADD CONSTRAINT "FK_3aaf5aa72987cf8e08d683ec917" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" DROP CONSTRAINT "FK_3aaf5aa72987cf8e08d683ec917"`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" DROP CONSTRAINT "FK_a1aa4b95aa8a82120ba1c480700"`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" DROP CONSTRAINT "FK_783d0356741cbac8295da3db9bc"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "google_index_book_requests"`);
    }

}
