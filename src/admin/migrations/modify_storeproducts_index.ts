import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// types
import { StoreProduct } from '../../types';
// beast
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Modifying storeproducts index');
    logger.info('');
    await backup(
      'storeproducts',
      path.join(__dirname, 'tmp/storeproducts.json'),
    );

    await restore<StoreProduct>(
      'storeproducts',
      path.join(__dirname, 'tmp/storeproducts.json'),
      (collection) =>
        collection.map((item) => ({
          ...item,
          stats: {
            ...item.stats,
            order_messages: item.stats.number_of_times_in_orders || 0,
            product_messages: 0,
          },
        })),
      {
        mappings: {
          properties: {
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
            store_info: {
              properties: {
                address: {
                  type: 'nested',
                  properties: {
                    location: {
                      type: 'geo_point',
                    },
                  },
                },
                delivery_area: {
                  type: 'geo_shape',
                  strategy: 'recursive',
                },
                opening_hours: {
                  type: 'nested',
                  properties: {
                    hours: {
                      type: 'nested',
                    },
                  },
                },
                created_at: { type: 'date' },
              },
            },
          },
        },
      },
    );
  } catch (error) {
    logger.error(
      { err: error },
      'Unexpected error in modify storeproducts index',
    );
  }
};

run();
