import Error from 'verror';
import moment from 'moment-timezone';

import elastic from '../../../beast/clients/elastic';
import {
  SearchParams,
  SearchResponse,
  Product,
  CreateParams,
  UpdateParams,
  CreateProduct,
} from '../../../types';
import utils from '../../../beast/utils';
import logger from '../../../beast/logger';
import storeClient from '../../stores/clients/store-client';

const prefix = '[product client]';

class ProductClient {
  /**
   * Search products
   * @param store string
   * @param params SearchParams
   * @returns Promise<SearchResponse<Product>
   */
  async search(
    store: string,
    params: SearchParams,
  ): Promise<SearchResponse<Product>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
        must_not: [],
      };
      if (params.query) {
        bool.filter.push({
          multi_match: {
            query: params.query,
            fields: ['name^3', 'description^3', 'tags^1.5'],
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        });
      }
      if (store !== 'all') {
        bool.must.push({
          match_phrase: {
            'store_info.id.keyword': {
              query: store,
            },
          },
        });
      }
      if (params.filters) {
        if ('enabled' in params.filters) {
          bool.must.push({
            match_phrase: {
              enabled: {
                query: params.filters.enabled,
              },
            },
          });
        }
        if ('reference' in params.filters) {
          bool.must.push({
            match_phrase: {
              'reference.keyword': {
                query: params.filters.reference,
              },
            },
          });
        }
        if ('location' in params.filters) {
          bool.filter.push({
            geo_shape: {
              'store_info.delivery_area': {
                shape: {
                  type: 'Point',
                  coordinates: [
                    params.filters.location.lon,
                    params.filters.location.lat,
                  ],
                },
                relation: 'intersects',
              },
            },
          });
        }
        if ('store_open' in params.filters) {
          if (params.filters.store_open) {
            // TODO: add support for other countries
            const date = moment().tz('America/Santiago');
            let day = `${date.day()}`;
            const minutes = date.minutes();
            const time = parseInt(
              `${date.hour()}${minutes < 10 ? `0${minutes}` : minutes}`,
              10,
            );
            if (day === '0') {
              day = '7';
            }

            bool.must.push({
              nested: {
                path: 'store_info.opening_hours',
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          'store_info.opening_hours.day': day,
                        },
                      },
                      {
                        range: {
                          'store_info.opening_hours.open': {
                            lte: time,
                          },
                        },
                      },
                      {
                        range: {
                          'store_info.opening_hours.close': {
                            gt: time,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            });
          }
        }
        if ('store_enabled' in params.filters) {
          bool.must.push({
            match_phrase: {
              'store_info.enabled': {
                query: params.filters.store_enabled,
              },
            },
          });
        }
        if ('must_not_id' in params.filters) {
          bool.must_not.push({
            match_phrase: {
              _id: {
                query: params.filters.must_not_id.split('|')[1],
              },
            },
          });
        }
        if ('ids' in params.filters) {
          bool.must.push({
            bool: {
              should: (params.filters.ids as string[]).map((id: string) => ({
                match_phrase: {
                  _id: id.split('|')[1],
                },
              })),
              minimum_should_match: 1,
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] = [
        { updated_at: { order: 'desc' } },
      ];
      if (params.sort) {
        sort = Object.keys(params.sort).map((field) => ({
          [field]: { order: (params.sort as any)[field] },
        }));
      }

      const response = await elastic.search({
        index: 'products*',
        body: {
          query: {
            bool,
          },
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
        },
      });

      return {
        query: params.query,
        filters: params.filters,
        from: params.from,
        size: params.size,
        sort: params.sort,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          // TODO: delete when all app client > 1.0.57
          store: _source.store_info.id,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching products`,
      );
    }
  }

  /**
   * Create a product
   * @param storeId string
   * @param params CreateParams<CreateProduct>
   * @returns Promise<Product>
   */
  async create(
    storeId: string,
    params: CreateParams<CreateProduct>,
  ): Promise<Product> {
    try {
      // find already created product
      const searchResponse = await this.search(storeId, {
        filters: { reference: params.body.reference },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as Product;
        logger.info(
          `${prefix} A product is already created, product id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`,
        );
        return utils.mapObject(alreadyCreated, params.source);
      }

      // create index if not exist
      const index = 'products';
      await utils.createIndexIfNotExist(index, {
        mappings: {
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

      // TODO: remove in the future
      let store_info: any = params.body.store_info;
      if (!store_info) {
        const store = await storeClient.get(storeId);
        store_info = {
          id: store.id,
          delivery_area: store.delivery_area.geometry,
          opening_hours: store.opening_hours,
        };
      }

      const newProduct = {
        ...params.body,
        store_info,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newProduct,
      });
      return utils.mapObject(
        {
          ...newProduct,
          id: `${response.body._index}|${response.body._id}`,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating product`,
      );
    }
  }

  /**
   * Update a product
   * @param store: string
   * @param product: string
   * @param params UpdateParams<Product>
   * @returns Promise<void>
   */
  async update(
    store: string,
    product: string,
    params: UpdateParams<Product>,
  ): Promise<void> {
    try {
      const [_index, _id] = product.split('|');
      await elastic.update({
        index: _index,
        id: _id,
        body: {
          doc: {
            ...params.body,
            updated_at: new Date(),
          },
        },
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, product, params } },
        `${prefix} Unexpected error updating product`,
      );
    }
  }

  /**
   * Delete product
   * @param store string
   * @param product string
   * @returns Promise<void>
   */
  async delete(store: string, product: string): Promise<void> {
    try {
      const [_index, _id] = product.split('|');
      await elastic.delete({
        index: _index,
        id: _id,
        refresh: 'true',
      });
    } catch (error) {
      throw new Error(
        { cause: error, info: { store, product } },
        `${prefix} Unexpected error deleting product`,
      );
    }
  }
}

export default new ProductClient();
