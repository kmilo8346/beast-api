import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';

import {
  SearchParams,
  SearchResponse,
  Order,
  UpdateParams,
  CreateParams,
  CreateOrder,
} from '../../../types';
import elastic from '../../../beast/clients/elastic';
import logger from '../../../beast/logger';
import utils from '../../../beast/utils';
import config from '../../../beast/config';

const prefix = '[order client]';
const pubSubClient = new PubSub();

class OrderClient {
  /**
   * Get order
   * @param id string
   * @param source string[]
   */
  public async get(id: string, source?: string[]): Promise<Order> {
    try {
      const [_index, _id] = id.split('|');
      const response = await elastic.get({
        index: _index,
        id: _id,
        _source: source,
      });
      return {
        ...response.body._source,
        id: `${response.body._index}|${response.body._id}`,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, source } },
        `${prefix} Unexpected error getting order`,
      );
    }
  }

  /**
   * Search orders
   * @param params
   */
  public async search(params: SearchParams): Promise<SearchResponse<Order>> {
    try {
      // filters
      const bool: {
        must: any[];
        filter: any[];
        should: any[];
      } = {
        must: [],
        filter: [],
        should: [],
      };
      if (params.filters) {
        if ('idempotency' in params.filters) {
          bool.must.push({
            match_phrase: {
              'idempotency.keyword': {
                query: params.filters.idempotency,
              },
            },
          });
        }
        if ('customer' in params.filters) {
          bool.must.push({
            match_phrase: {
              'customer.id.keyword': {
                query: params.filters.customer,
              },
            },
          });
        }
        if ('store' in params.filters) {
          bool.must.push({
            match_phrase: {
              'transaction.shopping_cart.store.id.keyword': {
                query: params.filters.store,
              },
            },
          });
        }
        if ('seller' in params.filters) {
          bool.must.push({
            match_phrase: {
              'transaction.shopping_cart.store.user.keyword': {
                query: params.filters.seller,
              },
            },
          });
        }
        if ('water_mark' in params.filters) {
          bool.must.push({
            range: {
              updated_at: {
                gt: params.filters.water_mark,
                lte: new Date().toISOString(),
                format: 'strict_date_optional_time',
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
        index: 'orders*',
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
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching over orders`,
      );
    }
  }

  /**
   * Create order
   * @param params
   */
  async create(params: CreateParams<CreateOrder>): Promise<any> {
    try {
      // find already created store
      const searchResponse = await this.search({
        filters: { idempotency: params.body.idempotency },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as Order;
        logger.info(
          `${prefix} A order is already created, order id ${alreadyCreated.id}, idempotency ${alreadyCreated.idempotency}`,
        );
        return utils.mapObject(alreadyCreated, params.source);
      }

      const index = 'orders';
      // creating index if not exist
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            transaction: {
              properties: {
                delivery_address: {
                  properties: {
                    location: {
                      type: 'geo_point',
                    },
                  },
                },
                shopping_cart: {
                  properties: {
                    store: {
                      properties: {
                        delivery_area: {
                          properties: {
                            center: {
                              properties: {
                                location: {
                                  type: 'geo_point',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });
      const newOrder = {
        ...params.body,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newOrder,
      });
      const order: Order = {
        ...newOrder,
        id: `${response.body._index}|${response.body._id}`,
      };

      // emit event
      const event = 'order.created';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(order)), {
          id: order.id,
          time: new Date().toISOString(),
          source: 'beast-api',
        });
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );

      return utils.mapObject(order, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error creating order`,
      );
    }
  }

  /**
   * Update order
   * @param id
   * @param params
   */
  private async update(id: string, params: UpdateParams<any>): Promise<void> {
    try {
      const [_index, _id] = id.split('|');
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
        { cause: error, info: { id, params } },
        'Unexpected error updating order',
      );
    }
  }
}

export default new OrderClient();
