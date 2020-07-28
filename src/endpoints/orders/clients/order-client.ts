import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';
import moment from 'moment';

import {
  CreateParams,
  CreateOrder,
  SearchParams,
  SearchResponse,
  Order,
} from '../../../types';
import logger from '../../../beast/logger';
import config from '../../../beast/config';
import elastic from '../../../beast/clients/elastic';
import utils from '../../../beast/utils';

const prefix = '[payment client]';
const pubSubClient = new PubSub();

class OrderClient {
  /**
   *
   * @param params
   */
  async create(params: CreateParams<CreateOrder>): Promise<Partial<Order>> {
    try {
      // precondition
      if (!params.idempotency) {
        throw new Error(
          `${prefix} Idempotency id is required to create a order`,
        );
      }

      // finding already created order using idempotency
      let order: Order | undefined;
      const searchResponse = await this.search({
        filters: { idempotency: params.idempotency },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        order = searchResponse.hits[0] as Order;
        logger.info(
          `${prefix} Order with idempotency ${params.idempotency} is already created, using order: ${order.id}`,
        );
      }

      // saving new order in elastic
      if (!order) {
        const index = `orders-${moment().format('YYYY-MM-DD')}`;
        // creating index if not exist
        await utils.createIndexIfNotExist(index, {
          mappings: {
            properties: {
              // TODO: add more mapping
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
            },
          },
        });
        const newOrder = {
          ...params.body,
          idempotency: params.idempotency,
          created_at: new Date(),
          updated_at: new Date(),
        };
        const response = await elastic.index({
          index,
          refresh: 'true',
          body: newOrder,
        });
        order = {
          ...newOrder,
          id: response.body._id,
          index: response.body._index,
        };
      }

      // emitting orders.${status}
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_ORDER_PREFIX')}.${
        order.status
      }`;
      logger.info(`${prefix} Publishing ${topic}`);
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(order)), {
          id: order.id,
          time: new Date(order.created_at).toISOString(),
          source: 'beast-api',
        });
      logger.info(`${prefix} Event published id: ${messageId}`);

      return utils.mapObject(order, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating order`,
      );
    }
  }

  /**
   *
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Order>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
        if (params.filters.idempotency) {
          must.push({
            match_phrase: {
              'idempotency.keyword': {
                query: params.filters.idempotency,
              },
            },
          });
        }
        if (params.filters.customer) {
          must.push({
            match_phrase: {
              'customer.id.keyword': {
                query: params.filters.customer,
              },
            },
          });
        }
        if (params.filters.store) {
          must.push({
            match_phrase: {
              'transaction.store.id.keyword': {
                query: params.filters.store,
              },
            },
          });
        }
        if (params.filters.status) {
          const should = params.filters.status.map((status: string) => ({
            match_phrase: {
              'status.keyword': status,
            },
          }));
          must.push({
            bool: {
              should,
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
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
      }

      const response = await elastic.search({
        index: 'orders-*',
        body: {
          query: {
            bool: {
              must,
            },
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
          id: _id,
          index: _index,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching over orders`,
      );
    }
  }
}

export default new OrderClient();
