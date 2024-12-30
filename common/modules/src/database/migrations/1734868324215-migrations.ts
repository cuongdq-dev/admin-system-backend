import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1734868324215 implements MigrationInterface {
    name = 'Migrations1734868324215'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('NEW', 'RECEIVED', 'READED', 'PENDING', 'FAILED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('MESSAGE', 'SYSTEM', 'COMMENT', 'ORDER', 'DELIVERY', 'PROMOTION', 'PAYMENT', 'REFUND', 'FEEDBACK', 'REMINDER', 'ACCOUNT')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "title" text, "message" text, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'NEW', "type" "public"."notifications_type_enum", "meta_data" text, "user_id" uuid NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
    }

}
