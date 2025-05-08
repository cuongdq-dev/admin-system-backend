import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1746691952874 implements MigrationInterface {
    name = 'Migrations1746691952874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chapters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "title" character varying(255) NOT NULL, "chapter_number" integer NOT NULL, "content" text NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "book_id" uuid NOT NULL, CONSTRAINT "PK_a2bbdbb4bdc786fe0cb0fcfc4a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a2bbdbb4bdc786fe0cb0fcfc4a" ON "chapters" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0b065f87386fff5c63768493d" ON "chapters" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "books" ADD "total_chapter" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "chapters" ADD CONSTRAINT "FK_23af8ea9e68fef63d07b189e8d1" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapters" DROP CONSTRAINT "FK_23af8ea9e68fef63d07b189e8d1"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "total_chapter"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0b065f87386fff5c63768493d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2bbdbb4bdc786fe0cb0fcfc4a"`);
        await queryRunner.query(`DROP TABLE "chapters"`);
    }

}
