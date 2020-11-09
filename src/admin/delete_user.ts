import path from 'path';
import fs from 'fs';
import util from 'util';

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
    logger.info(`Products deleted ${response.body.deleted}`);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error deleting products');
    throw error;
  }
};

const deleteStore = async (store: string) => {
  logger.info(`Deleting store ${store}`);
  await storeClient.delete(store);
  logger.info('Store deleted');
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
    const id = 'oqKhZGyTIxh7ELvgg1u0Bx615SS2';
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
