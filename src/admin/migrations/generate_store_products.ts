// types
import { Store } from '../../types';
// beast
import utils from '../../beast/utils';
import logger from '../../beast/logger';
import storeClient from '../../endpoints/stores/clients/store-client';
import productClient from '../../endpoints/products/clients/product-client';
import storeProductClient from '../../endpoints/store-products/clients/store-product-client';

const run = async () => {
  try {
    logger.info('Generating store products');
    logger.info('');

    await utils.createIndexIfNotExist('storeproducts', {
      mappings: {
        properties: {
          suggest: {
            type: 'completion',
            contexts: [
              {
                name: 'store_location',
                type: 'geo',
                path: 'store_info.address.location',
                precision: 5,
              },
            ],
          },
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
              opening_hours: { type: 'nested' },
            },
          },
        },
      },
    });

    let from = 0;
    let response;
    let total = 0;
    do {
      response = await productClient.search('all', {
        from,
        size: 10,
        sort: { 'store.keyword': 'asc' },
      });
      let store: Store | undefined;
      for (let i = 0; i < response.hits.length; i++) {
        const product = response.hits[i];
        if (!store || store.id !== product.store) {
          store = await storeClient.get(product.store);
        }
        await storeProductClient.create({
          body: {
            ...product,
            suggest: {
              input: [product.name, ...(product.tags || [])],
              contexts: {
                store_location: [
                  {
                    lat: store.delivery_area.center.location.lat,
                    lon: store.delivery_area.center.location.lon,
                  },
                ],
              },
            },
            store_info: {
              id: store.id,
              name: store.name,
              enabled: store.enabled,
              images: store.images,
              address: store.delivery_area.center,
              delivery_area: store.delivery_area.geometry,
              delivery_time: store.delivery_time,
              opening_hours: store.opening_hours,
            },
          },
        });
        total++;
      }
      from += response.hits.length;
    } while (from < response.total);

    logger.info(`${total} store products generated`);
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error generating store products');
  }
};

run();
