import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1751445153623 implements MigrationInterface {
    name = 'Migrations1751445153623'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_a2b16e156944e4a83ea0855d8d8"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "UQ_ce95fdad274bc89831916e64902"`);
        await queryRunner.query(`CREATE TABLE "user_permissions_roles" ("permission_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_e46578bd94c08a1877f5d5d96e8" PRIMARY KEY ("permission_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1b26fb0d73b7ff0cdae9a1049d" ON "user_permissions_roles" ("permission_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_44cd078d68990149988f98e801" ON "user_permissions_roles" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP COLUMN "role_id"`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "UQ_804909b94cad65b7d49d8baab90" UNIQUE ("action", "subject")`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" ADD CONSTRAINT "FK_1b26fb0d73b7ff0cdae9a1049d7" FOREIGN KEY ("permission_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" ADD CONSTRAINT "FK_44cd078d68990149988f98e8011" FOREIGN KEY ("role_id") REFERENCES "user_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" DROP CONSTRAINT "FK_44cd078d68990149988f98e8011"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_roles" DROP CONSTRAINT "FK_1b26fb0d73b7ff0cdae9a1049d7"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "UQ_804909b94cad65b7d49d8baab90"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD "role_id" uuid NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44cd078d68990149988f98e801"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b26fb0d73b7ff0cdae9a1049d"`);
        await queryRunner.query(`DROP TABLE "user_permissions_roles"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "UQ_ce95fdad274bc89831916e64902" UNIQUE ("action", "subject", "role_id")`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_a2b16e156944e4a83ea0855d8d8" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
