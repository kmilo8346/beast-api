// clients
import storeClient from '../../endpoints/stores/clients/store-client';
import productClient from '../../endpoints/products/clients/product-client';
// types
import { Product, Store } from '../../types';
// beast
import logger from '../../beast/logger';
import elastic from '../../beast/clients/elastic';

const updateStoreProducts = async (store: Store) => {
  logger.info(`Updating store products related to store ${store.name}`);

  // getting products in store
  let from = 0;
  let response;
  const products: Product[] = [];
  do {
    response = await productClient.search(store.id, {
      from,
      size: 10,
      source: ['id'],
    });
    products.push(...response.hits);
    from += response.hits.length;
  } while (from < response.total);

  // bulk update
  const payload: any[] = [];
  products.forEach((product) => {
    payload.push({
      update: { _id: product.id, _index: 'storeproducts' },
    });
    payload.push({ doc: { store_info: { created_at: store.created_at } } });
  });

  if (payload.length) {
    const { body } = await elastic.bulk({
      refresh: 'true',
      body: payload,
    });

    if (body.errors) {
      logger.warn('Error in bulk updates');
      logger.info({ body });
    } else {
      logger.info('Store products updated');
    }
  } else {
    logger.info('Nothing to update');
  }
};

const run = async () => {
  try {
    logger.info('Adding store_info.created_at to store products');
    logger.info('');
    let from = 0;
    let response;
    do {
      response = await storeClient.search({
        from,
        size: 10,
      });
      for (let i = 0; i < response.hits.length; i++) {
        const store = response.hits[i];
        await updateStoreProducts(store);
      }
      from += response.hits.length;
    } while (from < response.total);
  } catch (error) {
    logger.error(
      { err: error },
      'Unexpected error adding store_info.created_at to store products',
    );
  }
};

run();
