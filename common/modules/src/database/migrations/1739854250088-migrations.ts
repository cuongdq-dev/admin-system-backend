import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1739854250088 implements MigrationInterface {
    name = 'Migrations1739854250088'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sites" ADD "teleToken" text`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "teleBotName" text`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "teleChatName" text`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "teleChatId" text`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" DROP CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "UQ_281e3f2c55652d6a22c0aa59fd7" UNIQUE ("id")`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" ADD CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variant_media" DROP CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "UQ_281e3f2c55652d6a22c0aa59fd7"`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" ADD CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "teleChatId"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "teleChatName"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "teleBotName"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "teleToken"`);
    }

}
