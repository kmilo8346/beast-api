import Error from 'verror';

import {
  CreateParams,
  SearchParams,
  SearchResponse,
  StoreProduct,
} from '../../../types';
import utils from '../../../beast/utils';
import logger from '../../../beast/logger';
import elastic from '../../../beast/clients/elastic';

const prefix = '[store product client]';
const index = 'storeproducts';

class StoreProductClient {
  /**
   * Search store products
   * @param params SearchParams
   * @returns Promise<SearchResponse<StoreProduct>
   */
  async search(params: SearchParams): Promise<SearchResponse<StoreProduct>> {
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

      if (params.filters) {
        if ('ids' in params.filters) {
          bool.must.push({
            bool: {
              should: (params.filters.ids as string[]).map((id: string) => ({
                match_phrase: {
                  _id: utils.parseId(id),
                },
              })),
              minimum_should_match: 1,
            },
          });
        }
        if ('store' in params.filters) {
          bool.must.push({
            match_phrase: {
              'store_info.id.keyword': {
                query: utils.parseId(params.filters.store),
              },
            },
          });
        }
        if ('enabled' in params.filters) {
          bool.must.push({
            match_phrase: {
              enabled: {
                query: params.filters.enabled,
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
        if ('reference' in params.filters) {
          bool.must.push({
            match_phrase: {
              'reference.keyword': {
                query: params.filters.reference,
              },
            },
          });
        }
        if ('must_not_id' in params.filters) {
          bool.must_not.push({
            match_phrase: {
              _id: {
                query: utils.parseId(params.filters.must_not_id),
              },
            },
          });
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
        index,
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
        filters: params.filters,
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id }: any) => ({
          ..._source,
          id: _id,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching store products`,
      );
    }
  }

  /**
   * Create a store product
   * @param params CreateParams<StoreProduct>
   * @returns Promise<StoreProduct>
   */
  async create(params: CreateParams<StoreProduct>): Promise<StoreProduct> {
    try {
      // find already created store product
      const searchResponse = await this.search({
        filters: { reference: params.body.reference },
        from: 0,
        size: 1,
        source: params.source,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as StoreProduct;
        logger.info(
          `${prefix} A store product is already created, store product id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`,
        );
        return alreadyCreated;
      }

      const { id, ...body } = params.body;
      const response = await elastic.index({
        id: utils.parseId(id),
        index,
        refresh: 'true',
        body,
      });

      return utils.mapObject(
        {
          ...body,
          id: response.body._id,
        },
        params.source,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating store product`,
      );
    }
  }
}

export default new StoreProductClient();
