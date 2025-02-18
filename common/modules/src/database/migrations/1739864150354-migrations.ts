import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1739864150354 implements MigrationInterface {
    name = 'Migrations1739864150354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "is_published"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "is_published" boolean NOT NULL DEFAULT false`);
    }

}
