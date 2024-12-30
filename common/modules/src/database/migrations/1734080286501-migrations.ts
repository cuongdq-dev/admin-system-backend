import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1734080286501 implements MigrationInterface {
    name = 'Migrations1734080286501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "server_services" ADD "script" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "server_services" DROP COLUMN "script"`);
    }

}
