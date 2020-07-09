import Error from 'verror';

import elastic from '../../../beast/clients/elastic';
import { SearchParams, SearchResponse } from '../../../types';

const index = 'stores';

class StoreClient {
  /**
   * Search over stores index
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const bool: { [key: string]: any } = {};
      if (params.query) {
        bool.must = {
          multi_match: {
            query: params.query,
            fields: ['name'],
          },
        };
      }
      if (params.filters) {
        if (params.filters.position) {
          bool.filter = bool.filter || {};
          bool.filter.geo_shape = {
            delivery_area: {
              shape: {
                type: 'Point',
                coordinates: params.filters.position,
              },
              relation: 'intersects',
            },
          };
        }
      }

      const response = await elastic.search({
        index,
        body: {
          query: {
            bool,
          },
          from: params.from,
          size: params.size,
          _source: params.source,
          sort: [{ 'name.keyword': { order: 'asc' } }],
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
        'Error searching over stores index',
      );
    }
  }
}

export default new StoreClient();
