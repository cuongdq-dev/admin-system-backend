import dataSource from '../../ormconfig';

async function clearSampleData() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Xóa dữ liệu từ các bảng
    await queryRunner.query(`DELETE FROM lang_content`);
    await queryRunner.query(`DELETE FROM langs`);

    await queryRunner.commitTransaction();
    console.log('Sample data cleared successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error clearing sample data:', error.message);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

void clearSampleData();
