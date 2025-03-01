import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1740815322088 implements MigrationInterface {
    name = 'Migrations1740815322088'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" DROP CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "UQ_281e3f2c55652d6a22c0aa59fd7" UNIQUE ("id")`);
        await queryRunner.query(`CREATE INDEX "IDX_78a9d3ee8e6f794a256734a43b" ON "user_tokens" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_30328e342512de476f24ea6d5f" ON "product_variant_media" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9b5b525a96ddc2c5647d7f7fa" ON "users" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c30f45ea7b47895ca14398e974" ON "media" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4fee31b76d5a123afc4593a99d" ON "trending" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_939eccd30a9735a2878f606b37" ON "trending_article" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_60818528127866f5002e7f826d" ON "posts" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_a7b2c155b5bad01eb952cf2e56" ON "categories" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ee047a84447f9363ffaf50e669" ON "sites" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4578b679503e1b86cc1c2531b9" ON "sites" ("domain") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0edaa624df4498e735f208d44" ON "repositories" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c7d38f304121da68fb6b04c01" ON "user_sessions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_8813e791fe4c6cc9de77c950c7" ON "addresses" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_b4e5008b7138148ed27942e9dc" ON "carts" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_6b5ba7411abc9f3656048d81b3" ON "cart_items" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_a8fcf679692db1c886e7f15d2b" ON "customers" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_06199bf799fd21e15abd53b3f5" ON "customer_sessions" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_1dba18d269fe5f21f8acc8a4d2" ON "customer_tokens" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_961d2780463f0bf9522955a3d4" ON "langs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_98443ab199b7b61e5c7655c925" ON "lang_content" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c884e321f927d5b86aac7c8f9e" ON "orders" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_1237daf748b7653a6ebb9492fe" ON "payments" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_995d8194c43edfc98838cabc5a" ON "products" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c75be52ce00352378318fe8242" ON "product_variants" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_11ec6dc47ac1bd8bcdd313d042" ON "servers" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_2f9dc5b3a2c915e0a7595f58eb" ON "services" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_0c3c9f79f8667cbee13d29b787" ON "server_services" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "product_variant_media" ADD CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" DROP CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c3c9f79f8667cbee13d29b787"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f9dc5b3a2c915e0a7595f58eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_11ec6dc47ac1bd8bcdd313d042"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c75be52ce00352378318fe8242"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_995d8194c43edfc98838cabc5a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1237daf748b7653a6ebb9492fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c884e321f927d5b86aac7c8f9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98443ab199b7b61e5c7655c925"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_961d2780463f0bf9522955a3d4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1dba18d269fe5f21f8acc8a4d2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06199bf799fd21e15abd53b3f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a8fcf679692db1c886e7f15d2b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b5ba7411abc9f3656048d81b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b4e5008b7138148ed27942e9dc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8813e791fe4c6cc9de77c950c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c7d38f304121da68fb6b04c01"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0edaa624df4498e735f208d44"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4578b679503e1b86cc1c2531b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee047a84447f9363ffaf50e669"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7b2c155b5bad01eb952cf2e56"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60818528127866f5002e7f826d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_939eccd30a9735a2878f606b37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4fee31b76d5a123afc4593a99d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c30f45ea7b47895ca14398e974"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9b5b525a96ddc2c5647d7f7fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30328e342512de476f24ea6d5f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78a9d3ee8e6f794a256734a43b"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "UQ_281e3f2c55652d6a22c0aa59fd7"`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" ADD CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "relatedQueries" DROP DEFAULT`);
    }

}
