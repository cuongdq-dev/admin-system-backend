import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1752826222503 implements MigrationInterface {
    name = 'Migrations1752826222503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role_permission_conditions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "conditions" jsonb, "properties" jsonb, CONSTRAINT "UQ_8f1864647df31d79f1bb15332e2" UNIQUE ("role_id", "permission_id"), CONSTRAINT "PK_d47c86154b1044abf767dc4bf0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d47c86154b1044abf767dc4bf0" ON "role_permission_conditions" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4a1fa615c4e62853d36974ce07" ON "role_permission_conditions" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "role_permission_conditions" ADD CONSTRAINT "FK_27ecc8a9612823f7563b9c16b19" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permission_conditions" ADD CONSTRAINT "FK_5b6ac01006b269bca09c52fe34d" FOREIGN KEY ("permission_id") REFERENCES "user_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_permission_conditions" DROP CONSTRAINT "FK_5b6ac01006b269bca09c52fe34d"`);
        await queryRunner.query(`ALTER TABLE "role_permission_conditions" DROP CONSTRAINT "FK_27ecc8a9612823f7563b9c16b19"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a1fa615c4e62853d36974ce07"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d47c86154b1044abf767dc4bf0"`);
        await queryRunner.query(`DROP TABLE "role_permission_conditions"`);
    }

}
