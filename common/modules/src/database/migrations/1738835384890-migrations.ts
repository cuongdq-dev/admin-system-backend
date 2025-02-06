import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1738835384890 implements MigrationInterface {
    name = 'Migrations1738835384890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "token" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "token" character varying(100) NOT NULL`);
    }

}
