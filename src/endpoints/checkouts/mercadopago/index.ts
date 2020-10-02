import Error from 'verror';

import config from '../../../beast/config';
import mercadopago from '../../../beast/clients/mercadopago';
import {
  MercadopagoPaymentProviderState,
  CreateCheckout,
  PaymentProvider,
  MercadopagoPaymentStatus,
  DispatchProvider,
} from '../../../types';
import ICheckout from '../checkout';
import bitlyClient from './clients/bitly-client';
import logger from '../../../beast/logger';

const prefix = '[mercado pago checkout]';

class MercadoPagoCheckout extends ICheckout {
  /**
   * Create a mercado pago checkout
   * @param data
   */
  async create(data: CreateCheckout): Promise<MercadopagoPaymentProviderState> {
    try {
      mercadopago.configure({
        access_token: data.transaction.store.seller_credentials.access_token,
      });

      const payload: any = {
        payer: {},
        items: data.transaction.shopping_cart.map((item) => ({
          id: item.id,
          title: item.name,
          description: item.description,
          quantity: item.qty,
          currency_id: data.transaction.currency,
          unit_price: item.price,
        })),

        notification_url: config.get('MERCADO_PAGO_NOTIFICATION_URL'),
        external_reference: data.reference,
      };
      if (data.dispatch_provider_id === DispatchProvider.OWNER) {
        payload.payer.name = data.customer.first_name;
        payload.payer.surname = data.customer.last_name;
        payload.payer.email = data.customer.email;
        payload.payer.phone = {
          area_code: '+56',
          number: parseInt(data.customer.phone.replace('+56', ''), 10),
        };
        payload.payer.address = {
          street_name: data.transaction.delivery_address.route.long_name,
          street_number: parseInt(
            data.transaction.delivery_address.street_number.long_name,
            10,
          ),
        };
        const redirect = `${config.get(
          'BEAST_WEB_URL',
        )}/checkout/mercadopago/?beast_redirect=${data.redirect_url}`;
        payload.back_urls = {
          success: redirect,
          failure: redirect,
          pending: redirect,
        };
        payload.auto_return = 'approved';
      }

      const response = await mercadopago.preferences.create(payload);

      let init_point = response.body.init_point;
      if (data.dispatch_provider_id === DispatchProvider.OWNER_RRSS) {
        try {
          const { link } = await bitlyClient.shorten(init_point);
          init_point = link;
        } catch (error) {
          logger.error(`${prefix} Unexpected error shortening url`);
        }
      }

      return {
        id: PaymentProvider.MERCADOPAGO,
        status: MercadopagoPaymentStatus.STARTED,
        checkout: {
          id: response.body.id,
          init_point,
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
