import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';

import {
  SearchParams,
  SearchResponse,
  Order,
  UpdateParams,
  CreateParams,
  CreateOrder,
  OrderStatus,
  ActionParams,
} from '../../../types';
import utils from '../../../beast/utils';
import logger from '../../../beast/logger';
import config from '../../../beast/config';
import elastic from '../../../beast/clients/elastic';

const index = 'orders';
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
      const response = await elastic.get({
        index,
        id: utils.parseId(id),
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
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
                query: utils.parseId(params.filters.store),
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
        if ('should_client' in params.filters) {
          bool.should.push({
            match_phrase: {
              'customer.id.keyword': {
                query: params.filters.should_client,
              },
            },
          });
        }
        if ('should_seller' in params.filters) {
          bool.should.push({
            match_phrase: {
              'transaction.shopping_cart.store.user.keyword': {
                query: params.filters.should_seller,
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
        source: params.source,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as Order;
        logger.info(
          `${prefix} A order is already created, order id ${alreadyCreated.id}, idempotency ${alreadyCreated.idempotency}`,
        );
        return alreadyCreated;
      }

      const newOrder = {
        ...params.body,
        status: OrderStatus.CREATED,
        stats: this.getStats(params.body),
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
        id: response.body._id,
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
  public async update(
    id: string,
    params: UpdateParams<Order>,
  ): Promise<Partial<Order>> {
    try {
      const _id = utils.parseId(id);
      const update = {
        ...params.body,
        updated_at: new Date(),
      };
      await elastic.update({
        index,
        id: _id,
        body: {
          doc: update,
        },
      });
      return utils.mapObject({ ...update, id: _id }, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error updating order',
      );
    }
  }

  /**
   * Accept order
   * @param id
   * @param params
   */
  public async confirm(
    id: string,
    params: ActionParams<Order>,
  ): Promise<Partial<Order>> {
    try {
      const _id = utils.parseId(id);
      // allow only if
      // status === created
      const update = {
        status: OrderStatus.CONFIRMED,
        updated_at: new Date(),
      };
      const response = await elastic.update({
        index,
        id: _id,
        body: {
          doc: update,
          _source: true,
        },
      });

      const event = 'order.confirmed';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient.topic(topic).publish(
        Buffer.from(
          JSON.stringify({
            ...response.body.get._source,
            id: _id,
          }),
        ),
        {
          id: _id,
          time: new Date().toISOString(),
          source: 'beast-api',
        },
      );
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );

      return utils.mapObject(update, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error confirming order',
      );
    }
  }

  /**
   * Delivery order
   * @param id
   * @param params
   */
  public async delivery(
    id: string,
    params: ActionParams<Order>,
  ): Promise<Partial<Order>> {
    try {
      const _id = utils.parseId(id);
      // allow only if
      // status === confirmed
      const update = {
        status: OrderStatus.DELIVERED,
        updated_at: new Date(),
      };
      const response = await elastic.update({
        index,
        id: _id,
        body: {
          doc: update,
          _source: true,
        },
      });

      const event = 'order.delivered';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient.topic(topic).publish(
        Buffer.from(
          JSON.stringify({
            ...response.body.get._source,
            id: _id,
          }),
        ),
        {
          id: _id,
          time: new Date().toISOString(),
          source: 'beast-api',
        },
      );
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );

      return utils.mapObject(update, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error delivering order',
      );
    }
  }

  /**
   * Cancel order
   * @param id
   * @param params
   */
  public async cancel(
    id: string,
    params: ActionParams<Order>,
  ): Promise<Partial<Order>> {
    try {
      const _id = utils.parseId(id);
      // allow only if
      // must be status === created || executer === seller and status === confirmed
      const update = {
        ...params.body,
        status: OrderStatus.CANCELLED,
        updated_at: new Date(),
      };
      const response = await elastic.update({
        index,
        id: _id,
        body: {
          doc: update,
          _source: true,
        },
      });

      const event = 'order.cancelled';
      const topic = `${config.get('GOOGLE_PUB_SUB_TOPIC_PREFIX')}/${event}`;
      const messageId = await pubSubClient.topic(topic).publish(
        Buffer.from(
          JSON.stringify({
            ...response.body.get._source,
            id: _id,
          }),
        ),
        {
          id: _id,
          time: new Date().toISOString(),
          source: 'beast-api',
        },
      );
      logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`,
      );

      return utils.mapObject(update, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { id, params } },
        'Unexpected error cancelling order',
      );
    }
  }

  private getStats(order: CreateOrder): { amount: number; total: number } {
    return order.transaction.shopping_cart.items.reduce(
      (stats, item) => {
        const result = { ...stats };
        result.amount += item.qty * item.price;
        result.total += item.qty;
        return result;
      },
      { amount: 0, total: 0 },
    );
  }
}

export default new OrderClient();
