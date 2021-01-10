import path from 'path';

// migration libs
import backup from './lib/backup';
// beast
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Making backup to all indexes');
    logger.info('');
    // await backup('devices', path.join(__dirname, 'tmp/devices.json'));
    // logger.info('');
    await backup('users', path.join(__dirname, 'tmp/users.json'));
    logger.info('');
    await backup('stores', path.join(__dirname, 'tmp/stores.json'));
    logger.info('');
    await backup('products', path.join(__dirname, 'tmp/products.json'));
    await backup(
      'storeproducts',
      path.join(__dirname, 'tmp/storeproducts.json'),
    );
    logger.info('');
    await backup('orders', path.join(__dirname, 'tmp/orders.json'));
    logger.info('');
    await backup(
      'notifications',
      path.join(__dirname, 'tmp/notifications.json'),
    );
  } catch (error) {
    logger.error(
      { err: error },
      'Unexpected error in making backup to all indexes',
    );
  }
};

run();
