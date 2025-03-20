import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1742453920928 implements MigrationInterface {
    name = 'Migrations1742453920928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "google_index_requests" ("id" SERIAL NOT NULL, "post_id" uuid NOT NULL, "site_id" uuid NOT NULL, "site_domain" text NOT NULL, "post_slug" text NOT NULL, "url" text NOT NULL, "requested_at" TIMESTAMP NOT NULL DEFAULT now(), "response" jsonb DEFAULT '[]'::jsonb, CONSTRAINT "UQ_5331f2debe22429b2afdd327de2" UNIQUE ("url"), CONSTRAINT "PK_2ab8d0ce864badb5ec6c5661e4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "site_posts" ALTER COLUMN "indexState" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP TABLE "google_index_requests"`);
    }

}
