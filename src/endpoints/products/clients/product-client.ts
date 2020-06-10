import Error from 'verror';

import elastic from '../../../beast/clients/elastic';
import { SearchParams, SearchResponse } from '../../../types';

const INDEX = 'products-*';

class ProductClient {
  /**
   * Search over products index
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const bool: { [key: string]: any } = {};
      if (params.query) {
        bool.must = {
          multi_match: {
            query: params.query,
            fields: [
              'name^2',
              'description',
              'categories',
              'tags',
              'store.name',
            ],
          },
        };
      }
      if (params.filters) {
        bool.filter = [];
        if (params.filters.position) {
          bool.filter.push({
            geo_shape: {
              'store.delivery_area': {
                shape: {
                  type: 'Point',
                  coordinates: params.filters.position,
                },
                relation: 'intersects',
              },
            },
          });
        }
        if (params.filters.store) {
          bool.filter.push({
            term: {
              'store.name.keyword': params.filters.store,
            },
          });
        }
      }

      const response = await elastic.search({
        index: INDEX,
        body: {
          query: {
            bool,
          },
          from: params.from,
          size: params.size,
          _source: params.source,
          sort: [{ 'store.name.keyword': { order: 'asc' } }],
        },
      });
      return {
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _id, _source }: any) => ({
          id: _id,
          ..._source,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        'Error searching over products index',
      );
    }
  }
}

export default new ProductClient();
