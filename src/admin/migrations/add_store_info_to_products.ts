import elastic from '../../beast/clients/elastic';
import logger from '../../beast/logger';
import { Store } from '../../types';

const prefix = '[add_store_info_to_products]';

const updateMapping = async () => {
  await elastic.indices.putMapping({
    index: 'products',
    body: {
      properties: {
        store_info: {
          properties: {
            delivery_area: {
              type: 'geo_shape',
              strategy: 'recursive',
            },
            opening_hours: { type: 'nested' },
          },
        },
        created_at: { type: 'date' },
        updated_at: { type: 'date' },
      },
    },
  });
};

const getStores = async () => {
  const response = await elastic.search({
    index: 'stores*',
    body: {
      from: 0,
      size: 1000,
      sort: [{ updated_at: { order: 'desc' } }],
    },
  });

  return {
    hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
      ..._source,
      id: `${_index}|${_id}`,
    })),
  };
};

const updateStoreProducts = async (store: Store) => {
  const result = await elastic.updateByQuery({
    index: 'products',
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: 'ctx._source["store_info"] = params.store',
        params: {
          store: {
            id: store.id,
            delivery_area: store.delivery_area.geometry,
            opening_hours: store.opening_hours,
          },
        },
      },
      query: {
        bool: {
          must: [
            {
              match_phrase: {
                'store.keyword': {
                  query: store.id,
                },
              },
            },
          ],
        },
      },
    },
  });
  return result;
};

const run = async () => {
  try {
    logger.info(`${prefix} Updating mapping to search over new structure...`);
    await updateMapping();
    logger.info(`${prefix} Getting stores...`);
    const stores = await getStores();
    for (let i = 0; i < stores.hits.length; i++) {
      const store = stores.hits[i];
      logger.info(`${prefix} Updating products for store: ${store.id}...`);
      const updateResponse = await updateStoreProducts(store);
      logger.info(`${prefix} Products updated ${updateResponse.body.updated}`);
    }
    logger.info(`${prefix} Add store info products migration was ok`);
  } catch (error) {
    logger.error(
      { err: error },
      `${prefix} Unexpected error in add store info products migration`,
    );
  }
};

run();
