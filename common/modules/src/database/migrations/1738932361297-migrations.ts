import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1738932361297 implements MigrationInterface {
    name = 'Migrations1738932361297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_040a733daa3050662023dc6679" ON "product_variant_media" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_63764db9d9aaa4af33e07b2f4b" ON "user_tokens" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a3ffb1c0c8416b9fc6f907b743" ON "users" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4e0fcac36e050de337b670d8b" ON "media" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f5eccb1dfde10c9170502595a" ON "sites" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_24dbc6126a28ff948da33e97d3" ON "categories" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2829ac61eff60fcec60d7274b9" ON "posts" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_54ddf9075260407dcfdd724857" ON "posts" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_a69d9e2ae78ef7d100f8317ae0" ON "posts" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_67fa365dcd46bd65397a019bec" ON "trending" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_aa27b0f41a160f6da4bfe0ff56" ON "trending_article" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_745d8f43d3af10ab8247465e45" ON "addresses" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b5f695a59f5ebb50af3c816081" ON "carts" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6fccf5ec03c172d27a28a82928" ON "cart_items" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_133ec679a801fab5e070f73d3e" ON "customers" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c684ecbaa67a634723776229c4" ON "customer_sessions" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_82085a2a1850e02d40a965306b" ON "customer_tokens" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e0bb7dc43457e44d0123fb3e52" ON "langs" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f087782732bcc9ac09386b17bb" ON "lang_content" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a72c3c0f683f6462415e653c3" ON "notifications" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_710e2d4957aa5878dfe94e4ac2" ON "orders" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_197ab7af18c93fbb0c9b28b4a5" ON "payments" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0806c755e0aca124e67c0cf6d7" ON "products" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_281e3f2c55652d6a22c0aa59fd" ON "product_variants" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef0c358c04b4f4d29b8ca68ddf" ON "repositories" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c0947efd9f3db2dcc010164d20" ON "servers" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba2d347a3168a296416c6c5ccb" ON "services" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e93e031a5fed190d4789b6bfd8" ON "user_sessions" ("id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a3fd6eef42016e7752c95c28e0" ON "server_services" ("id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a3fd6eef42016e7752c95c28e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e93e031a5fed190d4789b6bfd8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba2d347a3168a296416c6c5ccb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0947efd9f3db2dcc010164d20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef0c358c04b4f4d29b8ca68ddf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_281e3f2c55652d6a22c0aa59fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0806c755e0aca124e67c0cf6d7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_197ab7af18c93fbb0c9b28b4a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_710e2d4957aa5878dfe94e4ac2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a72c3c0f683f6462415e653c3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f087782732bcc9ac09386b17bb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0bb7dc43457e44d0123fb3e52"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82085a2a1850e02d40a965306b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c684ecbaa67a634723776229c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_133ec679a801fab5e070f73d3e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fccf5ec03c172d27a28a82928"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5f695a59f5ebb50af3c816081"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_745d8f43d3af10ab8247465e45"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa27b0f41a160f6da4bfe0ff56"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67fa365dcd46bd65397a019bec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a69d9e2ae78ef7d100f8317ae0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54ddf9075260407dcfdd724857"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2829ac61eff60fcec60d7274b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24dbc6126a28ff948da33e97d3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f5eccb1dfde10c9170502595a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4e0fcac36e050de337b670d8b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3ffb1c0c8416b9fc6f907b743"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63764db9d9aaa4af33e07b2f4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_040a733daa3050662023dc6679"`);
    }

}
