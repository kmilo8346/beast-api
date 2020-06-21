import Error from 'verror';
import lodash from 'lodash';

import mercadopago from '../../../beast/clients/mercadopago';
import elastic from '../../../beast/clients/elastic';
import { date } from '@hapi/joi';

const index = 'customers';
const prefix = '[customer client]';

interface Customer {
  id: string;
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  identification_type: string;
  indentification_number: string;
  default_address: string;
  default_card: string;
  mercadopago_customer_id: string;
  created_at: string;
  updated_at: string;
}

class CustomerClient {
  /**
   *
   * @param customer
   */
  async create(customer: Customer): Promise<Customer> {
    try {
      // create or get a already created mercado pago customer
      let mercadoPagoCustomer;
      try {
        const mpCustomerCreateResponse = await mercadopago.customers.create({
          email: customer.email,
        });
        mercadoPagoCustomer = mpCustomerCreateResponse.body;
      } catch (error) {
        const cause = lodash.find(error.cause);
        if (!cause || cause.code !== '101') {
          throw error;
        }
        const mpCustomerSearchResponse = await mercadopago.customers.search({
          qs: { email: customer.email },
        });
        if (!mpCustomerSearchResponse.body.results) {
          throw new Error(
            `${prefix} Error searching for and already created customer`,
          );
        }
        mercadoPagoCustomer = mpCustomerSearchResponse.body.results[0];
      }

      // index customer in db
      const body = {
        ...customer,
        mercadopago_customer_id: mercadoPagoCustomer.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const response = await elastic.index({
        index,
        id: body.id,
        refresh: 'true',
        body,
      });
      return {
        ...body,
        id: response.body._id,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { customer } },
        `${prefix} Error creating customer`,
      );
    }
  }

  /**
   *
   * @param customerId
   * @param customer
   */
  async update(customerId: string, customer: Partial<Customer>): Promise<any> {
    try {
      const doc = { ...customer, updated_at: new Date().toISOString() };
      const response = await elastic.update({
        id: customerId,
        index,
        refresh: 'true',
        body: {
          doc,
        },
      });
      return response;
    } catch (error) {
      throw new Error({ cause: error, info: {} }, 'Error updating customer');
    }
  }
}

export default new CustomerClient();
