import Error from 'verror';

// types
import { CreateParams, CreateMercadoPagoCheckout } from '../../../../types';
// beast
import logger from '../../../../beast/logger';
import mercadopago from '../../../../beast/clients/mercadopago';
// local clients
import bitlyClient from './bitly-client';

const prefix = '[checkout client]';

class CheckoutClient {
  /**
   *
   * @param params
   */
  async create(params: CreateParams<CreateMercadoPagoCheckout>): Promise<any> {
    try {
      mercadopago.configure({
        access_token:
          params.body.transaction.store.payment_provider.credentials
            .access_token,
      });

      const response = await mercadopago.preferences.create({
        payer: {
          name: params.body.customer.first_name,
          surname: params.body.customer.last_name,
          email: params.body.customer.email,
          phone: {
            area_code: '+56',
            number: parseInt(params.body.customer.phone.replace('+56', ''), 10),
          },
          address: {
            street_name:
              params.body.transaction.delivery_address.route.long_name,
            street_number: parseInt(
              params.body.transaction.delivery_address.street_number.long_name,
              10,
            ),
          },
        },
        items: [
          {
            id: `${new Date().getTime()}`,
            title: `Pedido de ${params.body.transaction.store.name}`,
            quantity: 1,
            currency_id: params.body.transaction.currency,
            unit_price: params.body.transaction.amount,
          },
        ],
      });

      let init_point = response.body.init_point;
      try {
        const { link } = await bitlyClient.shorten(init_point);
        init_point = link;
      } catch (error) {
        logger.error(`${prefix} Unexpected error shortening url`);
      }

      return {
        init_point,
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: params },
        `${prefix} Unexpected error creating mercado pago checkout`,
      );
    }
  }
}

export default new CheckoutClient();
