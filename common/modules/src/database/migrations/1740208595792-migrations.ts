import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1740208595792 implements MigrationInterface {
    name = 'Migrations1740208595792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."media_storage_type_enum" RENAME TO "media_storage_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."media_storage_type_enum" AS ENUM('LOCAL', 'S3', 'BASE64', 'URL')`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "storage_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "storage_type" TYPE "public"."media_storage_type_enum" USING "storage_type"::"text"::"public"."media_storage_type_enum"`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "storage_type" SET DEFAULT 'LOCAL'`);
        await queryRunner.query(`DROP TYPE "public"."media_storage_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."media_storage_type_enum_old" AS ENUM('LOCAL', 'S3', 'BASE64')`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "storage_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "storage_type" TYPE "public"."media_storage_type_enum_old" USING "storage_type"::"text"::"public"."media_storage_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "storage_type" SET DEFAULT 'LOCAL'`);
        await queryRunner.query(`DROP TYPE "public"."media_storage_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."media_storage_type_enum_old" RENAME TO "media_storage_type_enum"`);
    }

}
