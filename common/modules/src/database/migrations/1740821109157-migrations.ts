import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1740821109157 implements MigrationInterface {
    name = 'Migrations1740821109157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sites" ADD "adsense_client" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "adsense_slots" jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "adsense_slots"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "adsense_client"`);
    }

}
