import logger from '../beast/logger';
import elastic from '../beast/clients/elastic';
import userClient from '../endpoints/users/clients/user-client';
import storeClient from '../endpoints/stores/clients/store-client';

const deleteProducts = async (store: string) => {
  try {
    logger.info(`Deleting productos for store ${store}`);
    const response = await elastic.deleteByQuery({
      index: 'products',
      body: {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  'store.keyword': {
                    query: store,
                  },
                },
              },
            ],
          },
        },
      },
    });
    logger.info(`Products deleted ${response.body.deleted}`);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting products');
    throw error;
  }
};

const deleteStoreProducts = async (store: string) => {
  try {
    logger.info(`Deleting storeproductos for store ${store}`);
    const response = await elastic.deleteByQuery({
      index: 'storeproducts',
      body: {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  'store_info.id.keyword': {
                    query: store,
                  },
                },
              },
            ],
          },
        },
      },
    });
    logger.info(`Store products deleted ${response.body.deleted}`);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting store products');
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
      await deleteStoreProducts(user.current_store);
      await deleteStore(user.current_store);
      await updateUserCurrentStore(id);
    }
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting user store');
  }
};

run();
