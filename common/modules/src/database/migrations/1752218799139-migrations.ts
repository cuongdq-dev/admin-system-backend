import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1752218799139 implements MigrationInterface {
    name = 'Migrations1752218799139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" DROP CONSTRAINT "FK_44cd078d68990149988f98e8011"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" DROP CONSTRAINT "FK_1b26fb0d73b7ff0cdae9a1049d7"`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" ADD CONSTRAINT "FK_44cd078d68990149988f98e8011" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" ADD CONSTRAINT "FK_1b26fb0d73b7ff0cdae9a1049d7" FOREIGN KEY ("permission_id") REFERENCES "user_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" DROP CONSTRAINT "FK_1b26fb0d73b7ff0cdae9a1049d7"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" DROP CONSTRAINT "FK_44cd078d68990149988f98e8011"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" ADD CONSTRAINT "FK_1b26fb0d73b7ff0cdae9a1049d7" FOREIGN KEY ("permission_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" ADD CONSTRAINT "FK_44cd078d68990149988f98e8011" FOREIGN KEY ("role_id") REFERENCES "user_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
