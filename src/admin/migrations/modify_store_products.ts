// clients
import storeClient from '../../endpoints/stores/clients/store-client';
import orderClient from '../../endpoints/orders/clients/order-client';
import productClient from '../../endpoints/products/clients/product-client';
// types
import { Order, Product, Store } from '../../types';
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

const addCreatedAt = async () => {
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

const addStats = async () => {
  try {
    logger.info('Adding stats to store products');
    logger.info('');

    logger.info('Getting all orders');
    let from = 0;
    let response;
    const orders: Order[] = [];
    do {
      response = await orderClient.search({
        from,
        size: 10,
      });
      from += response.hits.length;
      orders.push(...response.hits);
    } while (from < response.total);
    logger.info('Getting all orders was ok');
    logger.info('');

    logger.info('Calculating number of times in orders');
    const numberOfTimesInOrders: { [key: string]: number } = {};
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      for (let j = 0; j < order.transaction.shopping_cart.items.length; j++) {
        const item = order.transaction.shopping_cart.items[j];
        numberOfTimesInOrders[item.id] = numberOfTimesInOrders[item.id] || 0;
        numberOfTimesInOrders[item.id] += 1;
      }
    }
    logger.info('Calculation finished');
    logger.info('');

    logger.info('Updating stats in store products');

    // creating bulk payload
    const payload: any[] = [];
    Object.keys(numberOfTimesInOrders).forEach((product) => {
      payload.push({
        update: { _id: product, _index: 'storeproducts' },
      });
      payload.push({
        doc: {
          stats: { number_of_times_in_orders: numberOfTimesInOrders[product] },
        },
      });
    });

    // executing bulk request
    if (payload.length) {
      const { body } = await elastic.bulk({
        refresh: 'true',
        body: payload,
      });

      if (body.errors) {
        logger.info('Error updating stats in store products');
        logger.info(
          body.items.reduce(
            (result: any, item: { update: { status: number } }) => {
              const r = { ...result };
              if (item.update.status === 200) {
                r.ok += 1;
              } else if (item.update.status === 404) {
                r.not_found += 1;
              } else {
                r.not_mapped += 1;
              }
              return r;
            },
            { ok: 0, not_found: 0, not_mapped: 0 },
          ),
        );
      } else {
        logger.info('Store products stats were updated');
      }
    } else {
      logger.info('Nothing to update');
    }
  } catch (error) {
    logger.error(
      { err: error },
      'Unexpected error adding store_info.created_at to store products',
    );
  }
};

const run = async () => {
  // await addCreatedAt();
  await addStats();
};

run();
