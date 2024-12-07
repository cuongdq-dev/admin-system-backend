import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableUuidOsspExtension1685564592710
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable the uuid-ossp extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optionally, you can remove the extension if needed
    await queryRunner.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
  }
}
