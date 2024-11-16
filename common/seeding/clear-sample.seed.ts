import dataSource from '../../ormconfig';

async function clearSampleData() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Repositories
    // const categoryRepository = dataSource.getRepository(Category);
    // const attributeRepository = dataSource.getRepository(Attribute);
    // const attributeValueRepository = dataSource.getRepository(AttributeValue);
    // const supplierRepository = dataSource.getRepository(Supplier);
    // const productRepository = dataSource.getRepository(Product);
    // const displayTypeRepository =
    //   dataSource.getRepository(AttributeDisplayType);

    // Xóa dữ liệu từ các bảng
    await queryRunner.query(`DELETE FROM product_attribute_values`);
    await queryRunner.query(`DELETE FROM wishlist_items`);
    await queryRunner.query(`DELETE FROM wishlists`);
    await queryRunner.query(`DELETE FROM reviews`);
    await queryRunner.query(`DELETE FROM order_items`);
    await queryRunner.query(`DELETE FROM orders`);
    await queryRunner.query(`DELETE FROM transactions`);
    await queryRunner.query(`DELETE FROM product_media`);
    await queryRunner.query(`DELETE FROM products`);
    await queryRunner.query(`DELETE FROM media`);
    await queryRunner.query(`DELETE FROM suppliers`);
    await queryRunner.query(`DELETE FROM attribute_values`);
    await queryRunner.query(`DELETE FROM attributes`);
    await queryRunner.query(`DELETE FROM attribute_display_types`);
    await queryRunner.query(`DELETE FROM categories`);

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
