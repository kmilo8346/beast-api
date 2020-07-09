import Error from 'verror';
import lodash from 'lodash';

import mercadopago from '../../../../beast/clients/mercadopago';
import { CreateParams } from '../../../../types';
import utils from '../../../../beast/utils';

const index = 'customers';
const prefix = '[customer client]';

interface Customer {
  id: string;
  email: string;
}

class CustomerClient {
  /**
   * Create or get a already created mercado pago customer
   * @param customer
   */
  async create(params: CreateParams<{ email: string }>): Promise<Customer> {
    try {
      let mercadoPagoCustomer;
      try {
        // TODO: add support to retry with idempotency
        const mpCustomerCreateResponse = await mercadopago.customers.create({
          email: params.body.email,
        });
        mercadoPagoCustomer = mpCustomerCreateResponse.body;
      } catch (error) {
        const cause = lodash.find(error.cause);
        if (!cause || cause.code !== '101') {
          throw error;
        }
        const mpCustomerSearchResponse = await mercadopago.customers.search({
          qs: { email: params.body.email },
        });
        if (!mpCustomerSearchResponse.body.results) {
          throw new Error(
            `${prefix} Error searching for an already created customer`,
          );
        }
        mercadoPagoCustomer = mpCustomerSearchResponse.body.results[0];
      }

      return utils.mapObject(mercadoPagoCustomer, params.source);
    } catch (error) {
      throw new Error(
        { cause: error, info: { params } },
        `${prefix} Error creating customer`,
      );
    }
  }
}

export default new CustomerClient();
