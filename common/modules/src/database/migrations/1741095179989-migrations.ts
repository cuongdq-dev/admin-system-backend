import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1741095179989 implements MigrationInterface {
    name = 'Migrations1741095179989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
    }

}
