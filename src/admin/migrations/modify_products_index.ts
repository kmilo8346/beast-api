import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// migration mappers
import productMap from './mappers/product';
// types
import { Product } from '../../types';
// beast
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Modifying products index');
    logger.info('');
    await backup('products', path.join(__dirname, 'tmp/products.json'));
    //
    await restore<Product>(
      'products',
      path.join(__dirname, 'tmp/products.json'),
      (collection) => collection,
      {
        mappings: {
          properties: {
            store_info: {
              properties: {
                delivery_area: {
                  type: 'geo_shape',
                  strategy: 'recursive',
                },
                opening_hours: { type: 'nested' },
              },
            },
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
