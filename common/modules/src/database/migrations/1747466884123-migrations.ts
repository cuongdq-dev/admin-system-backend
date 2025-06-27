import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1747466884123 implements MigrationInterface {
  name = 'Migrations1747466884123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chapters" ADD "voice_content" text`);
    await queryRunner.query(`ALTER TABLE "books" ADD "youtube_url" text`);
    await queryRunner.query(`ALTER TABLE "books" ADD "tiktok_url" text`);
    await queryRunner.query(`ALTER TABLE "books" ADD "facebook_url" text`);
    await queryRunner.query(
      `ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`,
    );
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "facebook_url"`);
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "tiktok_url"`);
    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "youtube_url"`);
    await queryRunner.query(
      `ALTER TABLE "chapters" DROP COLUMN "voice_content"`,
    );
  }
}
