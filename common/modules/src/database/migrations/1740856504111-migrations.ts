import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1740856504111 implements MigrationInterface {
    name = 'Migrations1740856504111'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_7afa448dd4430b2c5a4ff606f61"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_cb21ad2b1d8035eebda29b2f31f"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_cb21ad2b1d8035eebda29b2f31f" FOREIGN KEY ("article_id") REFERENCES "trending_article"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_7afa448dd4430b2c5a4ff606f61" FOREIGN KEY ("thumbnail_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_7afa448dd4430b2c5a4ff606f61"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_cb21ad2b1d8035eebda29b2f31f"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_cb21ad2b1d8035eebda29b2f31f" FOREIGN KEY ("article_id") REFERENCES "trending_article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_7afa448dd4430b2c5a4ff606f61" FOREIGN KEY ("thumbnail_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
