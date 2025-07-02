import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1751442271535 implements MigrationInterface {
    name = 'Migrations1751442271535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "action" character varying(50) NOT NULL, "subject" character varying(100) NOT NULL, "properties" jsonb, "conditions" jsonb, "role_id" uuid NOT NULL, CONSTRAINT "UQ_ce95fdad274bc89831916e64902" UNIQUE ("action", "subject", "role_id"), CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_01f4295968ba33d73926684264" ON "user_permissions" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a4db8b46655b113e08424a1f24" ON "user_permissions" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "name" character varying(100) NOT NULL, "description" text, "type" character varying(50) NOT NULL DEFAULT 'custom', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c1433d71a4838793a49dcad46a" ON "roles" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5a52fc6f7a8dae64f645b0914" ON "roles" ("created_at") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('ADMIN', 'USER')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "type" "public"."users_type_enum"`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_94e2000b5f7ee1f9c491f0f8a8" ON "users" ("type") `);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_a2b16e156944e4a83ea0855d8d8" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_a2b16e156944e4a83ea0855d8d8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94e2000b5f7ee1f9c491f0f8a8"`);
        await queryRunner.query(`ALTER TABLE "google_index_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "google_index_book_requests" ALTER COLUMN "response" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "social_description" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "author" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "books" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_books" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "chapters" ALTER COLUMN "keywords" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5a52fc6f7a8dae64f645b0914"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1433d71a4838793a49dcad46a"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4db8b46655b113e08424a1f24"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01f4295968ba33d73926684264"`);
        await queryRunner.query(`DROP TABLE "user_permissions"`);
    }

}
