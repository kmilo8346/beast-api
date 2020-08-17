import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';

import {
  SearchParams,
  SearchResponse,
  Order,
  Confirmation,
  UpdateParams,
  OrderStatus,
  OwnerDispatchStatus,
  GetParams,
} from '../../../types';
import config from '../../../beast/config';
import elastic from '../../../beast/clients/elastic';
import logger from '../../../beast/logger';

const prefix = '[order client]';
const pubSubClient = new PubSub();

class OrderClient {
  /**
   * Get order
   * @param id string
   * @param source string[]
   */
  private async get(id: string, source?: string[]): Promise<Order> {
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
              'provider.status.keyword': status,
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

  /**
   * Confirm order
   * @param id
   * @param params
   */
  public async confirm(
    id: string,
    params: UpdateParams<{
      confirmation: Confirmation;
    }>,
  ): Promise<void> {
    try {
      // update order
      await this.update(id, {
        body: {
          status: OrderStatus.CONFIRMED,
          provider: {
            status: OwnerDispatchStatus.CONFIRMED,
            confirmation: params.body.confirmation,
          },
        },
      });

      // get updated event
      const updatedOrder = await this.get(id);

      // emit event
      const event = 'order.confirmed';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(updatedOrder)), {
          id,
          time: new Date().toISOString(),
          source: 'beast-functions',
        });
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error confirming order',
      );
    }
  }

  /**
   * Deliver order
   * @param id
   * @param params
   */
  public async deliver(id: string, params: UpdateParams<any>): Promise<void> {
    try {
      // update order
      await this.update(id, {
        body: {
          status: OrderStatus.DELIVERED,
          provider: {
            status: OwnerDispatchStatus.DELIVERED,
          },
        },
      });

      // get updated event
      const updatedOrder = await this.get(id);

      // emit event
      const event = 'order.delivered';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(updatedOrder)), {
          id,
          time: new Date().toISOString(),
          source: 'beast-functions',
        });
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error delivering order',
      );
    }
  }
}

export default new OrderClient();
