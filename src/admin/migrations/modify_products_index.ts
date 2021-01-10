import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// types
import { Product } from '../../types';
// beast
import utils from '../../beast/utils';
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Modifying products index');
    logger.info('');
    await backup('products', path.join(__dirname, 'tmp/products.json'));

    await restore<Product>(
      'products',
      path.join(__dirname, 'tmp/products.json'),
      (collection) => collection,
      {
        mappings: {
          properties: {
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in modify products index');
  }
};

run();
