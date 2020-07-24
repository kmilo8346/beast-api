import Error from 'verror';
import { PubSub } from '@google-cloud/pubsub';
import moment from 'moment';

import {
  CreateParams,
  CreateShop,
  Shop,
  SearchParams,
  SearchResponse,
  Payment,
  CreatePayment,
} from '../../../types';
import logger from '../../../beast/logger';
import config from '../../../beast/config';
import elastic from '../../../beast/clients/elastic';
import utils from '../../../beast/utils';
import paymentClient from '../../payments/clients/payment-client';

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
        logger.info(`${prefix} Using a already created shop, id: ${shop.id}`);
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
      const topic = config.get('GOOGLE_PUB_SUB_TOPIC_SHOPS_CREATED');
      logger.info(`${prefix} Publishing ${topic}`);
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(shop)), {
          id: shop.id,
          time: new Date(shop?.created_at).toISOString(),
          source: 'beast-api',
        });
      logger.info(`${prefix} Event published id: ${messageId}`);

      // creting payments or orders
      for (let i = 0; i < shop.transaction.shopping_cart.length; i++) {
        const item = shop.transaction.shopping_cart[i];
        const idempotency = `${shop.transaction.country}-${item.store.id}-${shop.id}`;

        const payload = {
          status: 'pending',
          shop_id: shop.id,
          customer: shop.customer,
          transaction: {
            country: shop.transaction.country,
            currency: shop.transaction.currency,
            language: shop.transaction.language,
            delivery_address: shop.transaction.delivery_address,
            shopping_cart: item.data,
            payment_method: shop.transaction.payment_method,
            payment_info: shop.transaction.payment_info,
            store: item.store,
            stats: utils.getStats(item.data),
          },
        };

        if (shop.transaction.payment_method === 'CREDIT_CARD') {
          await paymentClient.create({
            body: payload as CreatePayment,
            idempotency,
          });
        } else {
          // logger.info(`${prefix} Publishing orders.pending event`);
          // messageId = await pubSubClient
          //   .topic(config.get('GOOGLE_PUB_SUB_TOPIC_ORDERS_PENDING')) // create_order
          //   .publish(Buffer.from(JSON.stringify(data)), {
          //     id,
          //     time: new Date(shop?.created_at).toISOString(),
          //     source: 'beast-api',
          //   });
          // logger.info(`${prefix} Event published ${messageId}`);
        }
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

// const operation_id = uuidv1();

// for (let i = 0; i < params.body.shopping_cart.length; i++) {
//   const { store, data } = params.body.shopping_cart[i];
//   const payment = {
//     ...params.body,
//     shopping_cart: data,
//     store,
//     operation_id,
//   };

//   logger.info(
//     `${prefix} Publishing payments.pending event for store: ${store.id}`,
//   );
//   const messageId = await pubSubClient
//     .topic(config.get('GOOGLE_PUB_SUB_TOPIC_PAYMENTS_PENDING'))
//     .publish(Buffer.from(JSON.stringify(payment)));
//   logger.info(`${prefix} Event published ${messageId}`);
// }

// return {
//   operation_id,
// };

// const data = params.body;

// for (let i = 0; i < data.shopping_cart.length; i++) {
//   const groupedProducts = data.shopping_cart[i];
//   const stats = utils.getStats(groupedProducts.data);
//   const store = groupedProducts.store;

//   logger.info(`${prefix} Creating token for payment ${i + 1}`);
//   logger.info(`${prefix} Configuring Beast access token`);
//   mercadopago.configure({
//     access_token: config.get('MERCADO_PAGO_ACCESS_TOKEN'),
//   });
//   const createCardTokenResponse = await mercadopago.card_token.create({
//     security_code: data.security_code,
//     card_id: data.card.id,
//   });
//   logger.info(`${prefix} Token generated :)`);

//   logger.info(`${prefix} Configuring ${store.name} access token`);
//   mercadopago.configure({
//     access_token: store.seller_credentials.access_token,
//   });

//   const createPaymentResponse = await mercadopago.payment.create({
//     transaction_amount: stats.ammount,
//     token: createCardTokenResponse.response.id,
//     description: `Compra en Shop Shop de ${stats.total} producto(s)`,
//     installments: data.installments,
//     payment_method_id: data.card.payment_method.id,
//     issuer_id: `${data.card.issuer.id}`,
//     payer: {
//       type: 'customer',
//       id: data.customer.mercado_pago_customer_id,
//       email: data.customer.email,
//       identification: {
//         type: data.card.cardholder.identification.type,
//         number: data.card.cardholder.identification.number,
//       },

//       first_name: data.customer.first_name,
//       last_name: data.customer.last_name,
//     },
//     // external_reference
//   });
//   logger.info(`${prefix} Payment created`, createPaymentResponse);
// }
