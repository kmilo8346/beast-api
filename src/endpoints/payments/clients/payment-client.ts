import Error from 'verror';
import { v1 as uuidv1 } from 'uuid';
import { PubSub } from '@google-cloud/pubsub';
import moment from 'moment';

import {
  CreateParams,
  CreatePayment,
  SearchParams,
  SearchResponse,
  Payment,
} from '../../../types';
import logger from '../../../beast/logger';
import config from '../../../beast/config';
import elastic from '../../../beast/clients/elastic';
import utils from '../../../beast/utils';

const prefix = '[payment client]';
const pubSubClient = new PubSub();

class PaymentClient {
  async create(params: CreateParams<CreatePayment>): Promise<Partial<Payment>> {
    try {
      // precondition
      if (!params.idempotency) {
        throw new Error(
          `${prefix} Idempotency id is required to create a payment`,
        );
      }

      // finding already created payment using idempotency
      let payment: Payment | undefined;
      const searchResponse = await this.search({
        filters: { idempotency: params.idempotency },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        payment = searchResponse.hits[0] as Payment;
        logger.info(
          `${prefix} Using already created payment, id: ${payment.id}`,
        );
      }

      // saving new payment in elastic
      if (!payment) {
        const index = `payments-${moment().format('YYYY-MM-DD')}`;
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
        const newPayment = {
          ...params.body,
          idempotency: params.idempotency,
          created_at: new Date(),
          updated_at: new Date(),
        };
        const response = await elastic.index({
          index,
          refresh: 'true',
          body: newPayment,
        });
        payment = {
          ...newPayment,
          id: response.body._id,
          index: response.body._index,
        };
      }

      // emitting payments.pending
      const topic = config.get('GOOGLE_PUB_SUB_TOPIC_PAYMENTS_PENDING');
      logger.info(`${prefix} Publishing ${topic}`);
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(payment)), {
          id: payment.id,
          time: new Date(payment.created_at).toISOString(),
          source: 'beast-api',
        });
      logger.info(`${prefix} Event published id: ${messageId}`);

      return utils.mapObject(payment, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Unexpected error creating payment`,
      );
    }
  }

  async search(params: SearchParams): Promise<SearchResponse<Payment>> {
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
        index: 'payments-*',
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
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: _id,
          index: _index,
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

export default new PaymentClient();
