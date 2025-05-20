import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUuidOsspExtension1685564592710
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable the uuid-ossp extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "unaccent";');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optionally, you can remove the extension if needed
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
    await queryRunner.query('DROP EXTENSION IF EXISTS "unaccent";');
  }
}
