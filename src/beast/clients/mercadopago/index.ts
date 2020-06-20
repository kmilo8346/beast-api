// @ts-ignore
import mercadopago from 'mercadopago';
import axios from 'axios';
import Error from 'verror';

import config from '../../config';

mercadopago.configure({
  access_token: config.get('MERCADO_PAGO_ACCESS_TOKEN'),
});

// extending mercado pago library
const prefix = '[mercado pago extension]';
const request = axios.create({
  baseURL: config.get('MERCADO_PAGO_URL'),
  timeout: config.getNumber('MERCADO_PAGO_REQUEST_TIMEOUT'),
});

mercadopago.installments = {
  get: async (paymentMethodId: string, amount: number) => {
    try {
      const response = await request.get('payment_methods/installments', {
        params: {
          payment_method_id: paymentMethodId,
          amount,
          access_token: config.get('MERCADO_PAGO_ACCESS_TOKEN'),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        { cause: error, info: { paymentMethodId, amount } },
        `${prefix} Error getting installments`,
      );
    }
  },
};

mercadopago.payment_methods = {
  search: async (status: string, bins: string) => {
    try {
      const response = await request.get('payment_methods/search', {
        params: {
          status,
          bins,
          access_token: config.get('MERCADO_PAGO_ACCESS_TOKEN'),
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        { cause: error, info: { status, bins } },
        `${prefix} Error searching payment methods`,
      );
    }
  },
};

export default mercadopago;
