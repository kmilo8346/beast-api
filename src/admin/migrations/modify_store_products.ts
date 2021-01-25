// clients
import storeClient from '../../endpoints/stores/clients/store-client';
// types
import { Store } from '../../types';
// beast
import logger from '../../beast/logger';
import elastic from '../../beast/clients/elastic';

const updateStoreProducts = async (store: Store) => {
  logger.info(`Updating store products related to store ${store.name}`);
  const response = await elastic.updateByQuery({
    index: 'storeproducts',
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: `
          ctx._source.store_info.created_at = params.created_at;
        `,
        params: {
          created_at: store.created_at,
        },
      },
      query: {
        bool: {
          must: [
            {
              match_phrase: {
                'store_info.id.keyword': {
                  query: store.id,
                },
              },
            },
          ],
        },
      },
    },
  });
  logger.info(`Store products updated ${response.body.updated}`);
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
