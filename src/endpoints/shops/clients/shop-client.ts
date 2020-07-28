import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';
import moment from 'moment';

import {
  CreateParams,
  CreateShop,
  Shop,
  SearchParams,
  SearchResponse,
  OrderStatus,
  CreateOrder,
} from '../../../types';
import logger from '../../../beast/logger';
import config from '../../../beast/config';
import elastic from '../../../beast/clients/elastic';
import utils from '../../../beast/utils';
import paymentClient from '../../orders/clients/order-client';

const prefix = '[shop client]';
const pubSubClient = new PubSub();

class ShopClient {
  /**
   * Create a shop
   * @param paramss
   */
  async create(params: CreateParams<CreateShop>): Promise<Partial<Shop>> {
    try {
      // precondition
      if (!params.idempotency) {
        throw new Error(
          `${prefix} Idempotency id is required to create a shop`,
        );
      }

      // finding already created shop using idempotency
      let shop: Shop | undefined;
      const searchResponse = await this.search({
        filters: { idempotency: params.idempotency },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        shop = searchResponse.hits[0] as Shop;

        logger.info(
          `${prefix} Shop with idempotency ${params.idempotency} is already created, using shop: ${shop.id}`,
        );
      }

      // saving new shop in elastic
      if (!shop) {
        const index = `shop-${moment().format('YYYY-MM-DD')}`;
        // creating inndex if not exist
        await utils.createIndexIfNotExist(index, {
          mappings: {
            properties: {
              // TODO: add more mapping
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
            },
          },
        });

        const newShop = {
          ...params.body,
          idempotency: params.idempotency,
          created_at: new Date(),
          updated_at: new Date(),
        };
        const response = await elastic.index({
          index,
          refresh: 'true',
          body: newShop,
        });
        shop = {
          ...newShop,
          id: response.body._id,
          index: response.body._index,
        };
      }

      // emitting shops.created
      const topic = config.get('GOOGLE_PUB_SUB_TOPIC_SHOP_CREATED');
      logger.info(`${prefix} Publishing ${topic}`);
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(shop)), {
          id: shop.id,
          time: new Date(shop?.created_at).toISOString(),
          source: 'beast-api',
        });
      logger.info(`${prefix} Event published id: ${messageId}`);

      // creating orders
      for (let i = 0; i < shop.transaction.shopping_cart.length; i++) {
        const item = shop.transaction.shopping_cart[i];
        const idempotency = `${shop.transaction.country}-${item.store.id}-${shop.id}`;

        let status: OrderStatus = 'payment_pending';
        if (shop.transaction.payment_method === 'TO_AGREE') {
          status = 'confirmation_pending';
        }
        const newOrder = {
          status,
          shop_id: shop.id,
          customer: shop.customer,
          transaction: {
            country: shop.transaction.country,
            currency: shop.transaction.currency,
            language: shop.transaction.language,
            delivery_address: shop.transaction.delivery_address,
            payment_method: shop.transaction.payment_method,
            payment_info: shop.transaction.payment_info,
            shopping_cart: item.data,
            store: item.store,
            stats: utils.getStats(item.data),
          },
        };

        await paymentClient.create({
          body: newOrder as CreateOrder,
          idempotency,
        });
      }

      return utils.mapObject(shop, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        'Error creating a shop intent',
      );
    }
  }

  /**
   * Search shops
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Shop>> {
    try {
      const bool: { [key: string]: any } = { filter: [] };

      if (params.filters?.idempotency) {
        bool.filter.push({
          term: {
            'idempotency.keyword': params.filters.idempotency,
          },
        });
      }

      const response = await elastic.search({
        index: 'shop-*',
        body: {
          query: {
            bool,
          },
          from: params.from,
          size: params.size,
          _source: params.source,
          sort: [{ updated_at: { order: 'desc' } }],
        },
      });

      return {
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _id, _source }: any) => ({
          id: _id,
          ..._source,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching over shop intents`,
      );
    }
  }
}

export default new ShopClient();
