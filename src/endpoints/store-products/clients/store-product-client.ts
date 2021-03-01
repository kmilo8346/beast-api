import Error from 'verror';
import lodash from 'lodash';
import moment from 'moment-timezone';

import { SearchParams, SearchResponse, StoreProduct } from '../../../types';
import utils from '../../../beast/utils';
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
      const query: any = {
        bool: {
          must: [],
          filter: [],
          must_not: [],
        },
      };
      if (params.query) {
        query.bool.filter.push({
          multi_match: {
            query: params.query,
            fields: ['name^10', 'tags^10', 'store_info.name^10', 'description'],
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        });
      }

      if (params.filters) {
        if ('ids' in params.filters) {
          query.bool.must.push({
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
          query.bool.must.push({
            match_phrase: {
              'store_info.id.keyword': {
                query: utils.parseId(params.filters.store),
              },
            },
          });
        }
        if ('enabled' in params.filters) {
          query.bool.must.push({
            match_phrase: {
              enabled: {
                query: params.filters.enabled,
              },
            },
          });
        }
        if ('location' in params.filters) {
          query.bool.filter.push({
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
          query.bool.must.push({
            match_phrase: {
              'reference.keyword': {
                query: params.filters.reference,
              },
            },
          });
        }
        if ('must_not_id' in params.filters) {
          query.bool.must_not.push({
            match_phrase: {
              _id: {
                query: utils.parseId(params.filters.must_not_id),
              },
            },
          });
        }
        if ('store_open' in params.filters) {
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
          query.bool.must.push({
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
                      nested: {
                        path: 'store_info.opening_hours.hours',
                        query: {
                          bool: {
                            must: [
                              {
                                range: {
                                  'store_info.opening_hours.hours.open': {
                                    lte: time,
                                  },
                                },
                              },
                              {
                                range: {
                                  'store_info.opening_hours.hours.close': {
                                    gt: time,
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          });
        }
        if ('store_enabled' in params.filters) {
          query.bool.must.push({
            match_phrase: {
              'store_info.enabled': {
                query: params.filters.store_enabled,
              },
            },
          });
        }
        if ('store_address' in params.filters) {
          query.bool.filter.push({
            nested: {
              path: 'store_info.address',
              query: {
                match_phrase: {
                  'store_info.address.id.keyword': params.filters.store_address,
                },
              },
            },
          });
        }
        if ('store_created_at_gte' in params.filters) {
          query.bool.filter.push({
            range: {
              'store_info.created_at': {
                gte: params.filters.store_created_at_gte,
                format: 'strict_date_optional_time',
              },
            },
          });
        }
        if ('must_not_store_address' in params.filters) {
          query.bool.must_not.push({
            nested: {
              path: 'store_info.address',
              query: {
                match_phrase: {
                  'store_info.address.id.keyword':
                    params.filters.must_not_store_address,
                },
              },
            },
          });
        }
        // order_messages + product_messages
        if ('stats_number_of_times_in_order_gte' in params.filters) {
          query.bool.filter.push({
            script: {
              script: {
                source:
                  "doc['stats.order_messages'].value + doc['stats.product_messages'].value >= params.value",
                lang: 'painless',
                params: {
                  value: params.filters.stats_number_of_times_in_order_gte,
                },
              },
            },
          });
        }
      }

      // mapping sort
      let sort: { [key: string]: any }[] | undefined;
      if (params.sort) {
        sort = Object.keys(params.sort).map((field) => {
          // sort by location
          if (
            field === 'store_info.address.location' &&
            params.filters &&
            'location' in params.filters
          ) {
            return {
              _geo_distance: {
                'store_info.address.location': {
                  lat: params.filters.location.lat,
                  lon: params.filters.location.lon,
                },
                nested: {
                  path: 'store_info.address',
                },
                order: (params.sort as any)[field],
                unit: 'km',
              },
            };
          }

          // sort by order_messages + product_messages
          if (field === 'stats.number_of_times_in_orders') {
            return {
              _script: {
                type: 'number',
                script: {
                  lang: 'painless',
                  source:
                    "doc['stats.order_messages'].value + doc['stats.product_messages'].value",
                },
                order: (params.sort as any)[field],
              },
            };
          }
          return {
            [field]: { order: (params.sort as any)[field] },
          };
        });
      }

      console.log(JSON.stringify({ sort }));

      const payload: any = {
        index,
        body: {
          query,
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
          collapse: params.collapse,
        },
      };
      if (params.collapse) {
        payload.body.aggs = {
          total: {
            cardinality: {
              field: params.collapse.field,
            },
          },
        };
      }
      const response = await elastic.search(payload);

      return {
        from: params.from,
        size: params.size,
        total: params.collapse
          ? response.body.aggregations.total.value
          : response.body.hits.total.value,
        hits: response.body.hits.hits.map(
          ({ _source, _id, sort: s, inner_hits }: any) => {
            const result = {
              ..._source,
              id: _id,
            };

            if (inner_hits) {
              result.inner_hits = lodash
                .get<any[]>(
                  inner_hits,
                  `${params.collapse?.inner_hits?.name}.hits.hits`,
                  [],
                )
                .map((i) => ({
                  ...i._source,
                  id: i._id,
                }));
            }
            return result;
          },
        ),
        // to provide automatic pagination
        sort: params.sort,
        query: params.query,
        source: params.source,
        filters: params.filters,
        collapse: params.collapse,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching store products`,
      );
    }
  }
}

export default new StoreProductClient();
