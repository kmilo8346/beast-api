import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// types
import { Order } from '../../types';
// beast
import utils from '../../beast/utils';
import logger from '../../beast/logger';

const run = async () => {
  try {
    logger.info('Modifying orders index');
    logger.info('');
    // await backup('orders', path.join(__dirname, 'tmp/orders.json'));
    //
    await restore<Order>(
      'orders',
      path.join(__dirname, 'tmp/orders.json'),
      (collection) => collection,
      {
        mappings: {
          properties: {
            transaction: {
              properties: {
                delivery_address: {
                  properties: {
                    location: {
                      type: 'geo_point',
                    },
                  },
                },
                shopping_cart: {
                  properties: {
                    store: {
                      properties: {
                        delivery_area: {
                          properties: {
                            center: {
                              properties: {
                                location: {
                                  type: 'geo_point',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    );
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in modify orders index');
  }
};

run();
