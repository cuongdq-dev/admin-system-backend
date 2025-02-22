import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1740208646139 implements MigrationInterface {
    name = 'Migrations1740208646139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "mimetype" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "size" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "size" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "mimetype" SET NOT NULL`);
    }

}
