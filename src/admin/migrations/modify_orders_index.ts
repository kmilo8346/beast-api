import path from 'path';

// migration libs
import backup from './lib/backup';
import restore from './lib/restore';
// migration mappers
import placeMap from './mappers/place';
import storeMap from './mappers/store';
// types
import { Order } from '../../types';
// beast
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
      (collection) =>
        collection.reduce<Order[]>((newCollection, document) => {
          const doc = document as any;
          if (
            doc.status !== 'delivered' ||
            doc.dispatch_provider_id !== 'mercadopago'
          ) {
            return newCollection;
          }
          const {
            status,
            payment_provider_id,
            dispatch_provider_id,
            payment_provider,
            dispatch_provider,
            ...result
          } = doc;
          const { shopping_cart, store, ...transaction } = result.transaction;
          transaction.delivery_address = placeMap(
            result.transaction.delivery_address,
          );
          transaction.shopping_cart = {
            store: storeMap(store),
            items: shopping_cart,
          };
          result.transaction = transaction;
          result.stats = result.transaction.shopping_cart.items.reduce(
            (stats: any, item: any) => {
              const r = { ...stats };
              r.amount += item.qty * item.price;
              r.total += item.qty;
              return r;
            },
            { amount: 0, total: 0 },
          );
          return [...newCollection, result];
        }, []),
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
