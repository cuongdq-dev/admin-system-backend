import dataSource from '../../ormconfig';

async function clearSampleData() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(
      `DELETE FROM posts WHERE EXISTS (SELECT 1 FROM posts)`,
    );
    // await queryRunner.query(
    //   `DELETE FROM addresses WHERE EXISTS (SELECT 1 FROM addresses)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM cart_items WHERE EXISTS (SELECT 1 FROM cart_items)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM carts WHERE EXISTS (SELECT 1 FROM carts)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM customer_sessions WHERE EXISTS (SELECT 1 FROM customer_sessions)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM customer_tokens WHERE EXISTS (SELECT 1 FROM customer_tokens)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM customers WHERE EXISTS (SELECT 1 FROM customers)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM lang_content WHERE EXISTS (SELECT 1 FROM lang_content)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM langs WHERE EXISTS (SELECT 1 FROM langs)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM media WHERE EXISTS (SELECT 1 FROM media)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM migrations WHERE EXISTS (SELECT 1 FROM migrations)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM orders WHERE EXISTS (SELECT 1 FROM orders)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM payments WHERE EXISTS (SELECT 1 FROM payments)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM posts WHERE EXISTS (SELECT 1 FROM posts)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM product_variant_media WHERE EXISTS (SELECT 1 FROM product_variant_media)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM product_variants WHERE EXISTS (SELECT 1 FROM product_variants)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM products WHERE EXISTS (SELECT 1 FROM products)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM user_sessions WHERE EXISTS (SELECT 1 FROM user_sessions)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM user_tokens WHERE EXISTS (SELECT 1 FROM user_tokens)`,
    // );

    // await queryRunner.query(
    //   `DELETE FROM users WHERE EXISTS (SELECT 1 FROM users)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM server_services WHERE EXISTS (SELECT 1 FROM server_services)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM servers WHERE EXISTS (SELECT 1 FROM servers)`,
    // );
    // await queryRunner.query(
    //   `DELETE FROM services WHERE EXISTS (SELECT 1 FROM services)`,
    // );

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
