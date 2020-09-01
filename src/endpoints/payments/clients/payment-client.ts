import Error from 'verror';
import moment from 'moment';

import {
  CreateParams,
  SearchParams,
  SearchResponse,
  Payment,
  CreatePayment,
  PaymentStatus,
  PaymentProvider,
} from '../../../types';
import logger from '../../../beast/logger';
import elastic from '../../../beast/clients/elastic';
import utils from '../../../beast/utils';
import checkoutFactory from '../../checkouts/factory';

const prefix = '[shop client]';

class PaymentClient {
  /**
   * Create a payment
   * @param params
   */
  async create(params: CreateParams<CreatePayment>): Promise<Partial<Payment>> {
    try {
      let payment: Payment | null = null;

      // finding already created payment
      if (params.idempotency) {
        const searchResponse = await this.search({
          filters: { idempotency: params.idempotency },
          from: 0,
          size: 1,
        });
        if (searchResponse.hits.length) {
          payment = searchResponse.hits[0] as Payment;
          logger.info(
            `${prefix} A payment is already created, payment id ${payment.id}`,
          );
        }
      }

      // create preference and create new payment entity
      if (!payment) {
        // create preference
        const reference = utils.generateId();
        const checkout = checkoutFactory(
          // params.body.transaction.store.payment_provider,
          PaymentProvider.MERCADOPAGO,
        );
        const paymentProviderState = await checkout.create({
          reference,
          customer: params.body.customer,
          transaction: params.body.transaction,
          redirect_url: params.body.redirect_url,
        });

        const index = `payments-${moment().format('YYYY-MM-DD')}`;
        // creating index if not exist
        await utils.createIndexIfNotExist(index, {
          mappings: {
            properties: {
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
            },
          },
        });

        const newPayment = {
          ...params.body,
          status: PaymentStatus.CREATED,
          reference,
          provider: paymentProviderState,
          idempotency: params.idempotency,
          created_at: new Date(),
          updated_at: new Date(),
        };
        const indexResponse = await elastic.index({
          index,
          refresh: 'true',
          body: newPayment,
        });
        payment = {
          ...newPayment,
          id: `${indexResponse.body._index}|${indexResponse.body._id}`,
        };
      }

      return utils.mapObject(payment as Payment, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        'unexpected error creating a payment',
      );
    }
  }

  /**
   * Search payments
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Payment>> {
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
        index: 'payments-*',
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
        query: params.query,
        filters: params.filters,
        from: params.from,
        size: params.size,
        sort: params.sort,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error searching over payments`,
      );
    }
  }
}

export default new PaymentClient();
