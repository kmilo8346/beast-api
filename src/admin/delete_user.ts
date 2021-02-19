import logger from '../beast/logger';
import elastic from '../beast/clients/elastic';
import userClient from '../endpoints/users/clients/user-client';
import storeClient from '../endpoints/stores/clients/store-client';
import productClient from '../endpoints/products/clients/product-client';
import { Product, SearchResponse } from '../types';

const deleteProducts = async (store: string) => {
  try {
    logger.info(`Deleting productos for store ${store}`);

    // getting all products
    const products: Product[] = [];
    let from = 0;
    let response: SearchResponse<Product>;
    do {
      response = await productClient.search(store, {
        from,
        size: 10,
        source: ['id'],
      });
      products.push(...response.hits);
      from += response.hits.length;
    } while (response.total > from);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await productClient.delete(store, product.id);
    }

    logger.info(`Products deleted ${products.length}`);
  } catch (error) {
    logger.error({ err: error, store }, 'Unexpected error deleting products');
    throw error;
  }
};

const deleteStore = async (store: string) => {
  try {
    logger.info(`Deleting store ${store}`);
    await storeClient.delete(store);
    logger.info('Store deleted');
  } catch (error) {
    logger.error({ err: error, store }, 'Unexpected error deleting store');
    throw error;
  }
};

const deleteDevices = async (user: string) => {
  try {
    logger.info(`Deleting devices for user id ${user}`);
    const response = await elastic.deleteByQuery({
      index: 'devices',
      body: {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  'user_id.keyword': {
                    query: user,
                  },
                },
              },
            ],
          },
        },
      },
    });
    logger.info(`Devices deleted ${response.body.deleted}`);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting devices');
    throw error;
  }
};

const deleteUser = async (user: string) => {
  logger.info(`Deleting user ${user}`);
  await userClient.delete(user);
  logger.info('User deleted');
};

const run = async () => {
  try {
    const id = 'XLbIuncBjm2MZIADY5gF';
    const user = await userClient.get(id);
    if (user.current_store) {
      logger.info('User has store, deleting asociated store and products');
      await deleteProducts(user.current_store);
      await deleteStore(user.current_store);
    }
    await deleteDevices(id);
    await deleteUser(id);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting user');
  }
};

run();
