import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1737302299723 implements MigrationInterface {
    name = 'Migrations1737302299723'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "token" character varying(100) NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "type" "public"."user_tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_63764db9d9aaa4af33e07b2f4bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "name" character varying NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "country" character varying NOT NULL, "zip_code" character varying NOT NULL, "customer_id" uuid NOT NULL, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "customer_id" uuid NOT NULL, "is_order_created" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "variant_id" uuid NOT NULL, "quantity" integer NOT NULL, "price" integer, "cart_id" uuid NOT NULL, CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "first_name" character varying(50) NOT NULL, "last_name" character varying(50), "email" character varying(255) NOT NULL, "phone_number" character varying(13) NOT NULL, "country_code" character varying(3) NOT NULL, "password" character varying(255), "email_verified_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT false, "provider" character varying NOT NULL DEFAULT 'EMAIL', "avatar_id" uuid, CONSTRAINT "UQ_d08e15060201dd7cfe2bed06bbd" UNIQUE ("email", "phone_number"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "customer_id" uuid NOT NULL, CONSTRAINT "PK_c684ecbaa67a634723776229c4c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_db8c70768c3b1cd05287034995" ON "customer_sessions" ("customer_id") `);
        await queryRunner.query(`CREATE TABLE "customer_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "token" character varying(100) NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "type" "public"."customer_tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "customer_id" uuid NOT NULL, CONSTRAINT "PK_82085a2a1850e02d40a965306ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "langs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "code" character varying(200) NOT NULL, "name" character varying(200) NOT NULL, "description" character varying(200) NOT NULL, CONSTRAINT "UQ_8684c361867d6fb2b8512680bcc" UNIQUE ("code"), CONSTRAINT "PK_e0bb7dc43457e44d0123fb3e52f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lang_content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "code" character varying(200) NOT NULL, "content" character varying NOT NULL, "lang_id" uuid NOT NULL, CONSTRAINT "UQ_e570887f8707bf2a23b7c286460" UNIQUE ("code", "lang_id"), CONSTRAINT "PK_f087782732bcc9ac09386b17bbb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_variant_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "media_id" uuid, "variant_id" uuid, "rank" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_040a733daa3050662023dc66797" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "name" character varying(200) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255), "is_active" boolean NOT NULL DEFAULT false, "firebase_token" text, "avatar_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_2d4a15c7f8b3864a5465fb687ee" UNIQUE ("name", "email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "slug" character varying(500) NOT NULL, "filename" character varying(500), "url" character varying(500), "data" text, "mimetype" character varying(150) NOT NULL, "storage_type" "public"."media_storage_type_enum" NOT NULL DEFAULT 'LOCAL', "size" integer NOT NULL, CONSTRAINT "UQ_3cfd4afceb82a40bb84df8d7942" UNIQUE ("slug"), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "title" text, "message" text, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'NEW', "type" "public"."notifications_type_enum", "meta_data" text, "user_id" uuid NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "customer_id" uuid NOT NULL, "cart_id" uuid NOT NULL, "address_id" uuid NOT NULL, "static_address" jsonb, "success_payment_id" uuid, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'CREATED', CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "customer_id" uuid NOT NULL, "order_id" uuid NOT NULL, "transaction_id" character varying NOT NULL, "provider" "public"."payments_provider_enum" NOT NULL DEFAULT 'STRIPE', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trending" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "titleQuery" text, "formattedTraffic" character varying(100), "relatedQueries" jsonb, "thumbnail_id" uuid, "trendDate" character varying(500), CONSTRAINT "UQ_07978032babe71b558bb8a4ebec" UNIQUE ("titleQuery"), CONSTRAINT "PK_67fa365dcd46bd65397a019bec4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trending_article" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "source" character varying(150) NOT NULL, "url" character varying(500) NOT NULL, "trending_id" uuid NOT NULL, "thumbnail_id" uuid, "relatedQueries" jsonb, "meta_description" character varying(500), CONSTRAINT "UQ_b2bf49b4a8f685db1fafa00e6d4" UNIQUE ("url", "title"), CONSTRAINT "PK_aa27b0f41a160f6da4bfe0ff56a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "is_published" boolean NOT NULL DEFAULT false, "article_id" uuid, "category_id" uuid, "thumbnail_id" uuid, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "content" text NOT NULL, "relatedQueries" jsonb, "meta_description" character varying(500), "user_id" uuid, "status" "public"."posts_status_enum" NOT NULL DEFAULT 'NEW', CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "title" character varying(255) NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "metadata" jsonb NOT NULL DEFAULT '{}', "product_id" uuid NOT NULL, "price" numeric NOT NULL, "rank" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_281e3f2c55652d6a22c0aa59fd7" UNIQUE ("id"), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "repositories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "name" character varying(255) NOT NULL, "github_url" text NOT NULL, "fine_grained_token" text NOT NULL, "repo_env" text, "username" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "server_path" text, "image_id" character varying, "image_name" character varying, "container_id" character varying, "container_name" character varying, "server_id" uuid NOT NULL, "services" json, CONSTRAINT "UQ_98b624f19034b52b7d4a646b0c3" UNIQUE ("name"), CONSTRAINT "PK_ef0c358c04b4f4d29b8ca68ddff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "servers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "name" character varying(200) NOT NULL, "host" character varying(200) NOT NULL, "port" character varying(200) NOT NULL, "user" character varying(200) NOT NULL, "password" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "is_connected" boolean NOT NULL DEFAULT false, "owner_id" uuid NOT NULL, CONSTRAINT "UQ_0a87d33ca4cd4b8ef5390225144" UNIQUE ("name", "host"), CONSTRAINT "PK_c0947efd9f3db2dcc010164d20b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "name" character varying(100) NOT NULL, "icon" character varying(100) NOT NULL, "description" character varying(100) NOT NULL, "script" text, CONSTRAINT "UQ_019d74f7abcdcb5a0113010cb03" UNIQUE ("name"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "user_id" uuid NOT NULL, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e9658e959c490b0a634dfc5478" ON "user_sessions" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "server_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "created_by" uuid, "updated_by" uuid, "deleted_by" uuid, "server_id" uuid NOT NULL, "service_id" uuid NOT NULL, "installed" "public"."server_services_installed_enum" NOT NULL DEFAULT 'uninstalled', CONSTRAINT "PK_a3fd6eef42016e7752c95c28e02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_tokens" ADD CONSTRAINT "FK_9e144a67be49e5bba91195ef5de" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_7482082bf53fd0ba88a32e3de88" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_88c86583d64f733d8d1e61f9140" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_sessions" ADD CONSTRAINT "FK_db8c70768c3b1cd05287034995a" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_tokens" ADD CONSTRAINT "FK_603f63d478610e2c71e15dffc57" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lang_content" ADD CONSTRAINT "FK_9b5bff9125578e996b9e6c6a354" FOREIGN KEY ("lang_id") REFERENCES "langs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" ADD CONSTRAINT "FK_f76f25b545adea9c54509995de0" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" ADD CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c3401836efedec3bec459c8f818" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_f42b1d95404c45b10bf2451d814" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_d39c53244703b8534307adcd073" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d0b02233df1c52323107fe7b4d7" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trending" ADD CONSTRAINT "FK_7566eacaa77179b817485fcf2e9" FOREIGN KEY ("thumbnail_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trending_article" ADD CONSTRAINT "FK_8d906422c4a43197448c1c2665d" FOREIGN KEY ("trending_id") REFERENCES "trending"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trending_article" ADD CONSTRAINT "FK_740202989c5390a308f4138aae7" FOREIGN KEY ("thumbnail_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_cb21ad2b1d8035eebda29b2f31f" FOREIGN KEY ("article_id") REFERENCES "trending_article"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_852f266adc5d67c40405c887b49" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_7afa448dd4430b2c5a4ff606f61" FOREIGN KEY ("thumbnail_id") REFERENCES "media"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "repositories" ADD CONSTRAINT "FK_084cb5ac93ec6e55eb96975f8e0" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "servers" ADD CONSTRAINT "FK_4cb7e676891ed3a68a254f98dd2" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server_services" ADD CONSTRAINT "FK_c3e3970810bcdf92d54df6f2c56" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server_services" ADD CONSTRAINT "FK_d9be790386b312ef5b790be6f7f" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "server_services" DROP CONSTRAINT "FK_d9be790386b312ef5b790be6f7f"`);
        await queryRunner.query(`ALTER TABLE "server_services" DROP CONSTRAINT "FK_c3e3970810bcdf92d54df6f2c56"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "servers" DROP CONSTRAINT "FK_4cb7e676891ed3a68a254f98dd2"`);
        await queryRunner.query(`ALTER TABLE "repositories" DROP CONSTRAINT "FK_084cb5ac93ec6e55eb96975f8e0"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_7afa448dd4430b2c5a4ff606f61"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_852f266adc5d67c40405c887b49"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_cb21ad2b1d8035eebda29b2f31f"`);
        await queryRunner.query(`ALTER TABLE "trending_article" DROP CONSTRAINT "FK_740202989c5390a308f4138aae7"`);
        await queryRunner.query(`ALTER TABLE "trending_article" DROP CONSTRAINT "FK_8d906422c4a43197448c1c2665d"`);
        await queryRunner.query(`ALTER TABLE "trending" DROP CONSTRAINT "FK_7566eacaa77179b817485fcf2e9"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d0b02233df1c52323107fe7b4d7"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_d39c53244703b8534307adcd073"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_f42b1d95404c45b10bf2451d814"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c3401836efedec3bec459c8f818"`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" DROP CONSTRAINT "FK_68f8606d8be73e00cfb427ccf83"`);
        await queryRunner.query(`ALTER TABLE "product_variant_media" DROP CONSTRAINT "FK_f76f25b545adea9c54509995de0"`);
        await queryRunner.query(`ALTER TABLE "lang_content" DROP CONSTRAINT "FK_9b5bff9125578e996b9e6c6a354"`);
        await queryRunner.query(`ALTER TABLE "customer_tokens" DROP CONSTRAINT "FK_603f63d478610e2c71e15dffc57"`);
        await queryRunner.query(`ALTER TABLE "customer_sessions" DROP CONSTRAINT "FK_db8c70768c3b1cd05287034995a"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_88c86583d64f733d8d1e61f9140"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_7482082bf53fd0ba88a32e3de88"`);
        await queryRunner.query(`ALTER TABLE "user_tokens" DROP CONSTRAINT "FK_9e144a67be49e5bba91195ef5de"`);
        await queryRunner.query(`DROP TABLE "server_services"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9658e959c490b0a634dfc5478"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "servers"`);
        await queryRunner.query(`DROP TABLE "repositories"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "trending_article"`);
        await queryRunner.query(`DROP TABLE "trending"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "product_variant_media"`);
        await queryRunner.query(`DROP TABLE "lang_content"`);
        await queryRunner.query(`DROP TABLE "langs"`);
        await queryRunner.query(`DROP TABLE "customer_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db8c70768c3b1cd05287034995"`);
        await queryRunner.query(`DROP TABLE "customer_sessions"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP TABLE "carts"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP TABLE "user_tokens"`);
    }

}
