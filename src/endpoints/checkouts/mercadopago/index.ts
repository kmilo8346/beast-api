import Error from 'verror';

import config from '../../../beast/config';
import mercadopago from '../../../beast/clients/mercadopago';
import {
  PaymentProviderState,
  CreateCheckout,
  PaymentProvider,
  MercadopagoPaymentStatus,
} from '../../../types';
import ICheckout from '../checkout';

class MercadoPagoCheckout extends ICheckout {
  /**
   * Create a mercado pago checkout
   * @param data
   */
  async create(data: CreateCheckout): Promise<PaymentProviderState> {
    try {
      mercadopago.configure({
        access_token: data.transaction.store.seller_credentials.access_token,
      });
      const redirect = `${config.get(
        'BEAST_WEB_URL',
      )}/checkout/mercadopago?beast_redirect=${data.redirect_url}`;
      const response = await mercadopago.preferences.create({
        payer: {
          name: data.customer.first_name,
          surname: data.customer.last_name,
          email: data.customer.email,
          phone: {
            area_code: '+56',
            number: parseInt(data.customer.phone.replace('+56', ''), 10),
          },
          address: {
            street_name:
              data.transaction.delivery_address.street_number.long_name,
            street_number: parseInt(
              data.transaction.delivery_address.street_number.long_name,
              10,
            ),
          },
        },
        items: data.transaction.shopping_cart.map((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          quantity: item.qty,
          currency_id: data.transaction.currency,
          unit_price: item.price,
        })),
        back_urls: {
          success: redirect,
          failure: redirect,
          pending: redirect,
        },
        auto_return: 'approved',
        notification_url: config.get('MERCADO_PAGO_NOTIFICATION_URL'),
        external_reference: data.reference,
      });
      return {
        id: PaymentProvider.MERCADOPAGO,
        status: MercadopagoPaymentStatus.STARTED,
        checkout: {
          id: response.body.id,
          init_point: response.body.init_point,
        },
        data: {},
      };
    } catch (error) {
      throw new Error(
        { cause: error, info: { data } },
        'Unexpected error creating mercado pago checkout',
      );
    }
  }
}

export default MercadoPagoCheckout;
