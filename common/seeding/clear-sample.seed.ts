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
    await queryRunner.query(`DELETE FROM addresses`);
    await queryRunner.query(`DELETE FROM cart_items`);
    await queryRunner.query(`DELETE FROM carts`);
    await queryRunner.query(`DELETE FROM customer_sessions`);
    await queryRunner.query(`DELETE FROM customer_tokens`);
    await queryRunner.query(`DELETE FROM customers`);
    await queryRunner.query(`DELETE FROM lang_content`);
    await queryRunner.query(`DELETE FROM langs`);
    await queryRunner.query(`DELETE FROM media`);
    await queryRunner.query(`DELETE FROM migrations`);
    await queryRunner.query(`DELETE FROM orders`);
    await queryRunner.query(`DELETE FROM payments`);
    await queryRunner.query(`DELETE FROM posts`);
    await queryRunner.query(`DELETE FROM product_variant_media`);
    await queryRunner.query(`DELETE FROM product_variants`);
    await queryRunner.query(`DELETE FROM products`);
    await queryRunner.query(`DELETE FROM user_sessions`);
    await queryRunner.query(`DELETE FROM user_tokens`);
    await queryRunner.query(`DELETE FROM servers`);
    await queryRunner.query(`DELETE FROM users`);

    await queryRunner.query(`DROP TABLE addresses`);
    await queryRunner.query(`DROP TABLE cart_items`);
    await queryRunner.query(`DROP TABLE carts`);
    await queryRunner.query(`DROP TABLE customer_sessions`);
    await queryRunner.query(`DROP TABLE customer_tokens`);
    await queryRunner.query(`DROP TABLE customers`);
    await queryRunner.query(`DROP TABLE lang_content`);
    await queryRunner.query(`DROP TABLE langs`);
    await queryRunner.query(`DROP TABLE media`);
    await queryRunner.query(`DROP TABLE migrations`);
    await queryRunner.query(`DROP TABLE orders`);
    await queryRunner.query(`DROP TABLE payments`);
    await queryRunner.query(`DROP TABLE posts`);
    await queryRunner.query(`DROP TABLE product_variant_media`);
    await queryRunner.query(`DROP TABLE product_variants`);
    await queryRunner.query(`DROP TABLE products`);
    await queryRunner.query(`DROP TABLE user_sessions`);
    await queryRunner.query(`DROP TABLE user_tokens`);
    await queryRunner.query(`DROP TABLE servers`);
    await queryRunner.query(`DROP TABLE users`);

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
