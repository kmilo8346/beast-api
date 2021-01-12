import logger from '../beast/logger';
import { Product, SearchResponse } from '../types';
import userClient from '../endpoints/users/clients/user-client';
import storeClient from '../endpoints/stores/clients/store-client';
import productClient from '../endpoints/products/clients/product-client';

const deleteProducts = async (store: string) => {
  try {
    logger.info(`Deleting productos for store ${store}`);
    let from = 0;
    let products: SearchResponse<Product>;
    do {
      products = await productClient.search(store, { from, size: 10 });
      for (let i = 0; i < products.hits.length; i++) {
        const product = products.hits[i];
        await productClient.delete(store, product.id);
      }
      from += products.hits.length;
    } while (from < products.total);

    logger.info(`Products deleted ${from}`);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting products');
    throw error;
  }
};

const deleteStore = async (store: string) => {
  try {
    logger.info(`Deleting store ${store}`);
    await storeClient.delete(store);
    logger.info('Store deleted');
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting store');
    throw error;
  }
};

const updateUserCurrentStore = async (user: string) => {
  logger.info(`Updating user ${user}`);
  await userClient.update(user, { body: { current_store: null } });
  logger.info('User updated');
};

const run = async () => {
  try {
    const id = 'npCFboHJq0fz8MsU9CI7XdhEjG92';
    const user = await userClient.get(id);
    if (user.current_store) {
      await deleteProducts(user.current_store);
      await deleteStore(user.current_store);
      await updateUserCurrentStore(id);
    }
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting user store');
  }
};

run();
